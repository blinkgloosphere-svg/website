import type { Business } from "@/lib/types";
import { button, layout, sendEmail } from "@/lib/email";
import { site, whatsappLink } from "@/lib/site";

export type RenewalKind = "reminder" | "deactivated";

/** Renewal reminder (1 week before expiry) or deactivation notice, as the old system sent. */
export async function sendRenewalEmail(b: Business, kind: RenewalKind) {
  if (!b.ownerEmail) return false;
  const d = b.ratingDistribution;
  const blocked = (d[1] ?? 0) + (d[2] ?? 0) + (d[3] ?? 0);
  const subject =
    kind === "reminder"
      ? `Action required: your Blink subscription for ${b.name} ends in one week`
      : `Important: your Blink subscription for ${b.name} has been deactivated`;
  const headline = kind === "reminder" ? "Don't lose your momentum" : "Your subscription has ended";
  const lead =
    kind === "reminder"
      ? `Your subscription for <strong>${b.name}</strong> is scheduled to end in one week.`
      : `Your subscription for <strong>${b.name}</strong> has been deactivated. Your review page is now paused.`;
  const html = layout(
    headline,
    `<p style="font-size:15px">${lead}</p>
     <p style="font-size:15px">Here is what Blink has done for you so far:</p>
     <div style="background:#f7f8f8;border-radius:12px;padding:16px 18px;margin:16px 0;font-size:15px">
       <div style="margin-bottom:8px"><strong>Negative reviews kept off Google:</strong> ${blocked}</div>
       <div><strong>Total reviews collected:</strong> ${b.totalReviews}</div>
     </div>
     <p style="font-size:15px">Renew today to keep your page live and your rating protected.</p>` +
      button(whatsappLink(`Hi ${site.brand}, I'd like to renew Blink Reviews for ${b.name}.`), "Renew on WhatsApp"),
  );
  return sendEmail({ to: b.ownerEmail, subject, html });
}

/** Singapore calendar day [start, end) that is `days` from now, as epoch ms. */
export function sgDayWindow(days: number, now = new Date()) {
  const SG = 8 * 3600_000;
  const sgMidnight = Math.floor((now.getTime() + SG) / 86_400_000) * 86_400_000 - SG;
  const start = sgMidnight + days * 86_400_000;
  return { start, end: start + 86_400_000 };
}
