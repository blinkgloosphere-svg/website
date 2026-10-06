import { AuthCard } from "../auth-card";
import { ConfirmLink } from "./confirm-link";

export const metadata = { title: "Continue" };

type SP = Promise<{ token_hash?: string; type?: string; code?: string; kind?: string; next?: string }>;

/**
 * Landing page for links in login emails. Nothing is verified on page load,
 * only when the person taps Continue: mail scanners (Outlook Safe Links) open
 * links before the person does and would otherwise use them up.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const invite = sp.kind === "invite" || sp.type === "invite";
  return (
    <AuthCard title={invite ? "Welcome to Blink Reviews" : "Reset your password"} description={invite ? "Tap continue to choose your password." : "Tap continue to choose a new password."}>
      <ConfirmLink tokenHash={sp.token_hash ?? null} type={sp.type ?? null} code={sp.code ?? null} next={sp.next ?? null} />
    </AuthCard>
  );
}
