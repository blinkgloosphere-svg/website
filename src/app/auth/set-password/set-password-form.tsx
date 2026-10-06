"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm({ after }: { after: string }) {
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
    setMsg(null);
    let error: { message: string } | null;
    try {
      ({ error } = await createClient().auth.updateUser({ password: pw }));
    } catch {
      error = { message: "Could not reach the login server. Check your connection and try again." };
    }
    if (error) {
      setBusy(false);
      const same = /different from the old|same password/i.test(error.message);
      return setMsg({ kind: "error", text: same ? "Choose a password you haven't used before." : error.message });
    }
    setMsg({ kind: "success", text: "Password saved. Signing you in…" });
    router.replace(after);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" htmlFor="pw">
        <input id="pw" type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus />
      </Field>
      <Field label="Repeat password" htmlFor="pw2">
        <input id="pw2" type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
      </Field>
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? <Loader className="size-4 animate-spin" /> : null}
        Save password
      </button>
    </form>
  );
}
