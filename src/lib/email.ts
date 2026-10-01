import "server-only";
import { site } from "@/lib/site";

type Mail = { to: string | string[]; subject: string; html: string; replyTo?: string };

export const emailConfigured = () => !!process.env.RESEND_API_KEY;

/**
 * Sends through Resend when a key is configured. Otherwise logs a one-line
 * notice and returns false so callers can continue.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!emailConfigured()) {
    console.info(`[email skipped] ${mail.subject} -> ${Array.isArray(mail.to) ? mail.to.join(", ") : mail.to}`);
    return false;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: site.fromEmail, to: mail.to, subject: mail.subject, html: mail.html, replyTo: mail.replyTo });
  if (error) {
    console.error("[email failed]", error.message);
    return false;
  }
  return true;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f8f8;font-family:Inter,Helvetica,Arial,sans-serif;color:#08090a">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e6e7e8;border-radius:16px;padding:32px">
    <div style="font-weight:700;font-size:18px;letter-spacing:-0.02em">BL!NK <span style="color:#F5B400">★</span></div>
    <h1 style="font-size:22px;letter-spacing:-0.02em;margin:20px 0 8px">${esc(title)}</h1>
    ${body}
    <p style="color:#8a8f98;font-size:12px;margin-top:28px">${esc(site.name)} · ${esc(site.url)}</p>
  </div></body></html>`;
}

export function row(label: string, value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#62666d;font-size:14px;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:14px">${esc(String(value))}</td></tr>`;
}

export function table(rows: string) {
  return `<table style="border-collapse:collapse;margin-top:12px">${rows}</table>`;
}

export function button(href: string, label: string) {
  return `<p style="margin-top:24px"><a href="${esc(href)}" style="display:inline-block;background:#0b0b0c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:500">${esc(label)}</a></p>`;
}
