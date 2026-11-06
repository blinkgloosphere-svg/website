"use client";

import { useState, useTransition } from "react";
import { Notice } from "@/components/app/bits";
import { Copy, Key, LinkIcon, Loader } from "@/components/ui/icons";
import { loginLinkAction, setOwnerPasswordAction } from "@/app/admin/actions";

/** Easy-to-read temporary password, e.g. "Blink-4827-mt". */
function makePassword() {
  const n = crypto.getRandomValues(new Uint32Array(2));
  const letters = "abcdefghjkmnpqrstuvwxyz";
  return `Blink-${1000 + (n[0] % 9000)}-${letters[n[1] % letters.length]}${letters[(n[1] >> 8) % letters.length]}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Ways to get a client signed in without relying on the email arriving. */
export function LoginAccess({ businessId, email, disabled }: { businessId: string; email: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const getLink = () =>
    start(async () => {
      setMsg(null);
      const r = await loginLinkAction(email);
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      setLink(r.link);
      const copied = await copy(r.link);
      setMsg({ kind: "success", text: copied ? "Login link copied. Paste it to the client on WhatsApp." : "Login link ready. Copy it below." });
    });

  const savePw = () =>
    start(async () => {
      setMsg(null);
      const r = await setOwnerPasswordAction(businessId, pw);
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      const text = `Your Blink Reviews login\nhttps://reviews.blink.sg/login\nEmail: ${email}\nPassword: ${pw}\n(You can change it under Password after signing in.)`;
      const copied = await copy(text);
      setMsg({ kind: "success", text: copied ? "Password saved, and the login details are copied. Paste them to the client on WhatsApp." : "Password saved. Send the client their email and this password." });
    });

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="t-ui font-medium">Client can&apos;t get the email?</p>
      <p className="t-small mt-1 text-fg-secondary">Send them a login link or a password on WhatsApp instead.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || pending} onClick={getLink}>
          {pending && !showPw ? <Loader className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
          Copy login link
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={disabled || pending}
          onClick={() => {
            setShowPw((v) => !v);
            if (!pw) setPw(makePassword());
            setMsg(null);
          }}
        >
          <Key className="size-4" /> Set a password
        </button>
      </div>

      {link ? (
        <div className="mt-3">
          <div className="flex gap-2">
            <input readOnly value={link} className="input font-mono text-[12px]" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={() => copy(link)} aria-label="Copy link">
              <Copy className="size-4" />
            </button>
          </div>
          <p className="t-small mt-1 text-fg-tertiary">Works once, within 1 hour. The client taps it, then chooses their password.</p>
        </div>
      ) : null}

      {showPw ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={pw} onChange={(e) => setPw(e.target.value)} className="input font-mono" aria-label="New password for the client" autoComplete="off" />
          <button type="button" className="btn btn-primary btn-sm shrink-0" disabled={pending || pw.length < 8} onClick={savePw}>
            {pending ? <Loader className="size-4 animate-spin" /> : null}
            Save password
          </button>
        </div>
      ) : null}

      {msg ? (
        <div className="mt-3">
          <Notice kind={msg.kind}>{msg.text}</Notice>
        </div>
      ) : null}
    </div>
  );
}
