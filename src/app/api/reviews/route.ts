import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo, ReadOnlyError } from "@/lib/data";
import { button, layout, row, sendEmail, table } from "@/lib/email";
import { site } from "@/lib/site";
import { isJpeg, MAX_PHOTO_BYTES, MAX_PHOTOS, saveFeedbackPhotos } from "@/lib/feedback-photos";
import { subscriptionState } from "@/lib/types";

const schema = z.object({
  businessId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  initialClick: z.number().int().min(1).max(5).nullable().optional(),
  name: z.string().max(120).optional().default(""),
  email: z.string().max(200).optional().default(""),
  message: z.string().max(4000).optional().default(""),
  /** Set when adding written feedback to a low rating that was saved on tap. */
  reviewId: z.string().uuid().optional(),
});

/** How long after the tap the customer can still add their feedback to it. */
const FEEDBACK_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Very small in-memory throttle: one submission per business per IP per 20s. */
const recent = new Map<string, number>();
function throttled(key: string) {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > 60_000) recent.delete(k);
  const last = recent.get(key);
  recent.set(key, now);
  return last != null && now - last < 20_000;
}

/**
 * Reads the review from JSON, or from multipart form data when the customer
 * attached photos (fields in `review` as JSON, files in `photo`).
 */
async function readBody(req: Request): Promise<{ body: unknown; photos: Uint8Array[] } | { error: string }> {
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) return { body: await req.json().catch(() => null), photos: [] };
  const fd = await req.formData().catch(() => null);
  if (!fd) return { error: "Invalid review." };
  const files = fd.getAll("photo").filter((f): f is File => f instanceof File);
  if (files.length > MAX_PHOTOS) return { error: `Attach up to ${MAX_PHOTOS} photos.` };
  const photos: Uint8Array[] = [];
  for (const f of files) {
    if (f.size > MAX_PHOTO_BYTES) return { error: "One of the photos is too large." };
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (!isJpeg(bytes)) return { error: "One of the photos could not be read." };
    photos.push(bytes);
  }
  let body: unknown = null;
  try {
    body = JSON.parse(String(fd.get("review") ?? ""));
  } catch {
    /* handled by the schema check */
  }
  return { body, photos };
}

/** POST /api/reviews: records a rating (and private feedback with photos), alerts the owner. */
export async function POST(req: Request) {
  const read = await readBody(req);
  if ("error" in read) return NextResponse.json({ error: read.error }, { status: 400 });
  const parsed = schema.safeParse(read.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const input = parsed.data;
  // Photos only belong to private feedback; a 4 or 5 star rating goes to Google.
  const photos = input.rating <= 3 ? read.photos : [];

  const repo = await getRepo();
  const business = await repo.getBusiness(input.businessId);
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const state = subscriptionState(business);
  if (state === "expired" || state === "inactive") return NextResponse.json({ error: "This review page is paused." }, { status: 403 });

  // Feedback for a low rating saved on tap: fill in that same row instead of adding a second rating.
  // Only allowed once, shortly after the tap, for an empty low rating of this business.
  let earlier = input.reviewId ? await repo.getReview(input.reviewId) : null;
  if (
    earlier &&
    (earlier.businessId !== business.id || earlier.rating > 3 || earlier.message.trim() || Date.now() - Date.parse(earlier.createdAt) > FEEDBACK_WINDOW_MS)
  ) {
    earlier = null;
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // Adding feedback to an earlier tap is part of the same visit, so it is not throttled.
  if (!earlier && throttled(`${input.businessId}:${ip}`)) return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });

  const rating = earlier?.rating ?? (input.rating as 1 | 2 | 3 | 4 | 5);
  let saved = true;
  let reviewId: string | null = null;
  let photoCount = 0;
  try {
    const review = earlier
      ? await repo.updateReviewFeedback(earlier.id, { name: input.name, email: input.email, message: input.message })
      : await repo.createReview({
          businessId: business.id,
          rating,
          initialClick: (input.initialClick ?? null) as 1 | 2 | 3 | 4 | 5 | null,
          name: input.name,
          email: input.email,
          message: input.message,
        });
    reviewId = review.id;
    // The feedback is already saved; a failed photo upload must not lose it.
    photoCount = await saveFeedbackPhotos(business.id, review.id, photos).catch((e) => {
      console.error("[feedback photos]", e);
      return 0;
    });
  } catch (e) {
    if (!(e instanceof ReadOnlyError)) throw e;
    saved = false;
  }

  // Email the owner about 1 to 3 star feedback, only if they switched alerts on. A bare tap
  // (no feedback yet) is only recorded; the alert goes out when the customer sends their feedback.
  const isFeedback = !!earlier || !!input.message.trim() || photoCount > 0;
  if (rating <= 3 && isFeedback && business.sendEmailNotifications && business.ownerEmail) {
    await sendEmail({
      to: business.ownerEmail,
      subject: `New ${rating}-star review for ${business.name}`,
      html: layout(
        `Negative review alert for ${business.name}`,
        `<p style="font-size:15px;color:#62666d">A customer left a low rating. Blink kept it off Google so you can follow up first.</p>` +
          table(
            row("Rating", "★".repeat(rating)) +
              row("From", input.name || "Anonymous") +
              row("Email / phone", input.email || null) +
              row("Message", input.message || "No message") +
              (photoCount ? row("Photos", `${photoCount} attached. Open your dashboard to see them.`) : ""),
          ) +
          button(`${site.url}/dashboard/feedback`, "Open your dashboard"),
      ),
    });
  }

  return NextResponse.json({ ok: true, saved, id: reviewId, photos: photoCount });
}
