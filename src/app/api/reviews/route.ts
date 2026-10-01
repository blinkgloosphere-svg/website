import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo, ReadOnlyError } from "@/lib/data";
import { button, layout, row, sendEmail, table } from "@/lib/email";
import { site } from "@/lib/site";
import { subscriptionState } from "@/lib/types";

const schema = z.object({
  businessId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  initialClick: z.number().int().min(1).max(5).nullable().optional(),
  name: z.string().max(120).optional().default(""),
  email: z.string().max(200).optional().default(""),
  message: z.string().max(4000).optional().default(""),
});

/** Very small in-memory throttle: one submission per business per IP per 20s. */
const recent = new Map<string, number>();
function throttled(key: string) {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > 60_000) recent.delete(k);
  const last = recent.get(key);
  recent.set(key, now);
  return last != null && now - last < 20_000;
}

/** POST /api/reviews: records a rating (and private feedback), alerts the owner. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const input = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(`${input.businessId}:${ip}`)) return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });

  const repo = await getRepo();
  const business = await repo.getBusiness(input.businessId);
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const state = subscriptionState(business);
  if (state === "expired" || state === "inactive") return NextResponse.json({ error: "This review page is paused." }, { status: 403 });

  let saved = true;
  try {
    await repo.createReview({
      businessId: business.id,
      rating: input.rating as 1 | 2 | 3 | 4 | 5,
      initialClick: (input.initialClick ?? null) as 1 | 2 | 3 | 4 | 5 | null,
      name: input.name,
      email: input.email,
      message: input.message,
    });
  } catch (e) {
    if (!(e instanceof ReadOnlyError)) throw e;
    saved = false;
  }

  // Owners get an email for private feedback, and for every rating if they asked for it.
  const isFeedback = input.rating <= 3 && input.message.trim().length > 0;
  if (business.ownerEmail && (isFeedback || business.sendEmailNotifications)) {
    await sendEmail({
      to: business.ownerEmail,
      subject: isFeedback ? `Private feedback (${input.rating}★) for ${business.config.companyName}` : `New ${input.rating}★ rating for ${business.config.companyName}`,
      html: layout(
        isFeedback ? "A customer left private feedback" : "A customer rated you",
        table(
          row("Rating", `${input.rating} out of 5`) +
            row("Name", input.name || "Not given") +
            row("Contact", input.email || "Not given") +
            row("Message", input.message || "No message"),
        ) + button(`${site.url}/dashboard`, "Open your dashboard"),
      ),
    });
  }

  return NextResponse.json({ ok: true, saved });
}
