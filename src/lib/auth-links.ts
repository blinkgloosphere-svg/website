import "server-only";
import { button, emailConfigured, layout, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/server";

export type AccessKind = "invite" | "reset";

/**
 * Emails a one-time sign-in link that works in any browser.
 *
 * Supabase's default links use PKCE, which only works in the browser that
 * asked for the email. Links sent from the admin (or opened in the Outlook
 * app) therefore always showed "link has expired". Here the link carries a
 * token hash to /auth/confirm, where the person taps Continue and the browser
 * verifies it. Mail scanners that pre-open links never tap, so they can't use
 * the link up either.
 *
 * Returns false when the email has no login (callers decide whether to say so).
 */
export async function sendAccessLink(email: string, kind: AccessKind): Promise<boolean> {
  const db = createServiceClient();
  const target = email.trim().toLowerCase();

  if (!emailConfigured()) {
    // No Resend key on the server: let Supabase send it (works once its templates point at /auth/confirm).
    const redirectTo = `${site.url.replace(/\/+$/, "")}/auth/confirm`;
    const { error } = await db.auth.resetPasswordForEmail(target, { redirectTo });
    if (error) throw new Error(`resetPasswordForEmail: ${error.message}`);
    return true;
  }

  // Every business owner already has a confirmed login (created with the business), so a
  // recovery link covers both "set your password" and "reset your password".
  const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email: target });
  if (error) {
    if (/not\s*found|no user/i.test(error.message)) return false;
    throw new Error(`generateLink: ${error.message}`);
  }
  const hashed = data.properties?.hashed_token;
  if (!hashed) throw new Error("generateLink: no token returned");

  const link = `${site.url.replace(/\/+$/, "")}/auth/confirm?token_hash=${encodeURIComponent(hashed)}&type=recovery&kind=${kind}`;
  const invite = kind === "invite";
  const sent = await sendEmail({
    to: target,
    subject: invite ? "Your Blink Reviews login" : "Reset your Blink Reviews password",
    html: layout(
      invite ? "Welcome to Blink Reviews" : "Reset your password",
      `<p style="font-size:15px">${
        invite
          ? "Your Blink Reviews dashboard is ready. Tap the button below to choose your password and sign in."
          : "We received a request to reset your password. Tap the button below to choose a new one."
      }</p>` +
        button(link, invite ? "Set my password" : "Reset password") +
        `<p style="font-size:13px;color:#62666d;margin-top:20px">The link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>` +
        `<p style="font-size:13px;color:#62666d">Your login email: ${target}</p>`,
    ),
  });
  if (!sent) throw new Error("The email could not be sent. Check the Resend settings.");
  return true;
}
