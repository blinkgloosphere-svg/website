import "server-only";
import { button, layout, sendEmail } from "@/lib/email";
import { site, whatsappLink } from "@/lib/site";

/** Security notice after a password change, so an owner notices a change they didn't make. */
export async function sendPasswordChangedEmail(email: string, byAdmin = false) {
  const when = new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "short" });
  return sendEmail({
    to: email,
    subject: "Your Blink Reviews password was changed",
    html: layout(
      "Your password was changed",
      `<p style="font-size:15px">The password for your Blink Reviews login (${email}) was ${byAdmin ? "set by the Blink team" : "changed"} on ${when} (Singapore time).</p>` +
        `<p style="font-size:15px;color:#62666d">If this was you, there's nothing to do. If not, reset your password now and let us know on WhatsApp.</p>` +
        button(`${site.url}/login`, "Go to login") +
        `<p style="font-size:13px;color:#62666d;margin-top:16px"><a href="${whatsappLink("Hi Blink, my Blink Reviews password was changed and it wasn't me.")}">WhatsApp the Blink team</a></p>`,
    ),
  });
}
