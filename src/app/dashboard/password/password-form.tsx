"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ kind: "error", text: "Use at least 8 characters." });
    if (pw !== pw2) return setMsg({ kind: "error", text: "The two passwords don't match." });
    setBusy(true);
    let error: { message: string } | null;
    try {
      ({ error } = await createClient().auth.updateUser({ password: pw }));
    } catch {
      error = { message: "Could not reach the login server. Check your connection and try again." };
    }
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "success", text: "Password saved. Taking you to your dashboard…" });
    setTimeout(() => router.replace("/dashboard"), 900);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" htmlFor="pw">
        <input id="pw" type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      </Field>
      <Field label="Repeat password" htmlFor="pw2">
        <input id="pw2" type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
      </Field>
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? <Loader className="size-4 animate-spin" /> : null}
        Save password
      </button>
    </form>
  );
}
