import { NextResponse } from "next/server";
import { emailConfigured, layout, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";

/**
 * Email diagnostics for the team: is Resend connected, is the sending domain
 * verified, and what happened to the latest emails (delivered, bounced…).
 * Needs `Authorization: Bearer $CRON_SECRET`. `?to=` also sends a test email.
 * Recipient addresses are masked in the answer.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mask = (e: string) => e.replace(/^(.{2})[^@]*@/, "$1***@");
  const out: Record<string, unknown> = { resendKey: emailConfigured(), from: site.fromEmail };
  if (!emailConfigured()) return NextResponse.json(out);

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const to = new URL(req.url).searchParams.get("to");
  if (to) {
    out.testSent = await sendEmail({
      to,
      subject: "Blink Reviews email test",
      html: layout("Email test", `<p style="font-size:15px">If you can read this, Blink Reviews emails are reaching your inbox.</p>`),
    });
  }

  const domains = await resend.domains.list();
  out.domains = domains.error ? { error: domains.error.message } : domains.data?.data.map((d) => ({ name: d.name, status: d.status }));

  const emails = await resend.emails.list({ limit: 40 });
  out.recent = emails.error
    ? { error: emails.error.message }
    : emails.data?.data.map((e) => ({
        at: e.created_at,
        subject: e.subject,
        to: e.to.map(mask),
        from: e.from,
        status: e.last_event,
      }));
  return NextResponse.json(out);
}
