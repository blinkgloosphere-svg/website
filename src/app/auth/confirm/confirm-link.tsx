"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const OTP_TYPES: EmailOtpType[] = ["recovery", "invite", "magiclink", "signup", "email", "email_change"];

type Props = { tokenHash: string | null; type: string | null; code: string | null; next: string | null };

/** Verifies the email link in this browser when tapped, then sends the person on to set their password. */
export function ConfirmLink({ tokenHash, type, code, next }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/auth/set-password";

  async function go() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      // Older-style links put the session in the address fragment (#access_token=…).
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access = hash.get("access_token");
      const refresh = hash.get("refresh_token");

      let failed: string | null = null;
      if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
        failed = error?.message ?? null;
      } else if (access && refresh) {
        const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
        failed = error?.message ?? null;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        failed = error?.message ?? null;
      } else if (hash.get("error_description")) {
        failed = hash.get("error_description");
      } else {
        failed = "missing";
      }

      if (failed) {
        console.warn("[auth confirm]", failed);
        setError("This link has already been used or has expired. Request a new one below; it works once and lasts 1 hour.");
        setBusy(false);
        return;
      }
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Could not reach the login server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!error ? (
        <button type="button" onClick={go} disabled={busy} className="btn btn-primary w-full">
          {busy ? <Loader className="size-4 animate-spin" /> : null}
          Continue
        </button>
      ) : null}
      <Link href="/login" className="btn btn-ghost w-full">
        {error ? "Get a new link" : "Back to login"}
      </Link>
    </div>
  );
}
