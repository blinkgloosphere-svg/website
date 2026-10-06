"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordResetAction } from "./actions";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sent, setSent] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) {
        setBusy(false);
        setError("Email or password is incorrect.");
        return;
      }
      // Keep the spinner while the dashboard loads.
      router.replace(next);
      router.refresh();
    } catch {
      setBusy(false);
      setError("Could not reach the login server. Check your connection and try again.");
    }
  }

  async function forgot() {
    if (!email) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestPasswordResetAction(email);
      if (res.ok) setSent(true);
      else setError(res.error);
    } catch {
      setError("Could not reach the login server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <Notice kind="success">Check your inbox. If this email has a Blink login, we&apos;ve sent a link to set a new password. It works once and lasts 1 hour.</Notice>;
  }

  return (
    <form onSubmit={signIn} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <input id="email" type="email" className="input" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" type="password" className="input" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error ? <Notice kind="error">{error}</Notice> : null}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? <Loader className="size-4 animate-spin" /> : null}
        Sign in
      </button>
      <button type="button" onClick={forgot} disabled={busy} className="btn btn-ghost w-full">
        Forgot password?
      </button>
    </form>
  );
}
