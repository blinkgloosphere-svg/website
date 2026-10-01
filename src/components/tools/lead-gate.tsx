"use client";

import { useState } from "react";
import { Loader, X } from "@/components/ui/icons";
import type { LeadTool } from "@/lib/types";

export type LeadDraft = {
  tool: LeadTool;
  businessName: string;
  placeId: string | null;
  reviewLink: string | null;
  currentRating: number | null;
  currentCount: number | null;
  targetRating: number | null;
  reviewsNeeded: number | null;
};

type Props = {
  open: boolean;
  draft: LeadDraft;
  title: string;
  description: string;
  submitLabel: string;
  onClose: () => void;
  onDone: () => void;
};

/**
 * The form shown before a tool result is released. Captures name, phone, email
 * and marketing consent, and posts the lead to Blink.
 */
export function LeadGate({ open, draft, title, description, submitLabel, onClose, onDone }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please tick the box so we can send you the result.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, contactName: name, phone, email, consentMarketing: consent }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Something went wrong. Please try again.");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal aria-labelledby="lead-title">
      <form onSubmit={submit} className="card w-full max-w-md p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="lead-title" className="t-title-3">
              {title}
            </h2>
            <p className="t-ui mt-1 text-fg-secondary">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm -mr-2 -mt-1 px-2" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="lead-name">
              Your name
            </label>
            <input id="lead-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="lead-phone">
              Mobile number
            </label>
            <input
              id="lead-phone"
              className="input"
              required
              inputMode="tel"
              pattern="[0-9+ ]{8,16}"
              placeholder="+65 9123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label" htmlFor="lead-email">
              Email
            </label>
            <input id="lead-email" className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <label className="flex items-start gap-3 text-[13px] leading-snug text-fg-secondary">
            <input type="checkbox" className="mt-0.5 size-4 accent-ink" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree that Blink may contact me by WhatsApp, phone or email about this result and Blink&apos;s review services. I can
              opt out at any time.
            </span>
          </label>
          {error ? <p className="t-small text-danger">{error}</p> : null}
        </div>

        <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
          {busy ? <Loader className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>
        <p className="t-small mt-3 text-center text-fg-tertiary">Business: {draft.businessName}</p>
      </form>
    </div>
  );
}
