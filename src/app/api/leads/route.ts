import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo, ReadOnlyError } from "@/lib/data";
import { button, layout, row, sendEmail, table } from "@/lib/email";
import { site } from "@/lib/site";

const schema = z.object({
  tool: z.enum(["qr", "calculator"]),
  businessName: z.string().min(1).max(200),
  placeId: z.string().max(300).nullable(),
  reviewLink: z.string().url().max(500).nullable(),
  currentRating: z.number().min(0).max(5).nullable(),
  currentCount: z.number().int().min(0).nullable(),
  targetRating: z.number().min(0).max(5).nullable(),
  reviewsNeeded: z.number().int().min(0).nullable(),
  contactName: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(200),
  consentMarketing: z.boolean(),
});

/** POST /api/leads: saves a tool lead and emails Blink. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form fields." }, { status: 400 });
  if (!parsed.data.consentMarketing) return NextResponse.json({ error: "Consent is required." }, { status: 400 });

  const lead = parsed.data;
  const repo = await getRepo();
  let saved = true;
  try {
    await repo.createLead(lead);
  } catch (e) {
    if (!(e instanceof ReadOnlyError)) throw e;
    saved = false; // preview mode: nothing is stored
  }

  const toolName = lead.tool === "qr" ? "QR Code Generator" : "Rating Calculator";
  await sendEmail({
    to: site.leadsEmail,
    replyTo: lead.email,
    subject: `New lead from ${toolName}: ${lead.businessName}`,
    html: layout(
      `New lead from the ${toolName}`,
      table(
        row("Business", lead.businessName) +
          row("Contact", lead.contactName) +
          row("Phone", lead.phone) +
          row("Email", lead.email) +
          row("Current rating", lead.currentRating != null ? `${lead.currentRating} (${lead.currentCount ?? 0} reviews)` : null) +
          row("Target rating", lead.targetRating) +
          row("5-star reviews needed", lead.reviewsNeeded) +
          row("Review link", lead.reviewLink) +
          row("Consent", lead.consentMarketing ? "Yes" : "No"),
      ) + button(`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`, "WhatsApp this lead"),
    ),
  });

  return NextResponse.json({ ok: true, saved });
}
