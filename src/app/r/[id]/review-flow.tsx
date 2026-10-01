"use client";

import { useState } from "react";
import Image from "next/image";
import { Facebook, Globe, Instagram, Loader } from "@/components/ui/icons";
import type { BusinessConfig, Rating } from "@/lib/types";

type Props = { businessId: string; config: BusinessConfig; gatingEnabled: boolean };
type Step = "rate" | "positive" | "negative" | "done";

/**
 * The customer flow. Pick stars; 4 to 5 opens the Google review page, 1 to 3
 * asks for private feedback. With gating off, every rating goes to Google.
 */
export function ReviewFlow({ businessId, config, gatingEnabled }: Props) {
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState<Rating | null>(null);
  const [initial, setInitial] = useState<Rating | null>(null);
  const [hover, setHover] = useState<number>(0);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(payload: { rating: Rating; initialClick: Rating | null; name?: string; email?: string; message?: string }) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...payload }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "Could not send. Please try again.");
    }
  }

  async function pick(r: Rating) {
    if (busy) return;
    const first = initial ?? r;
    setInitial(first);
    setRating(r);
    const positive = !gatingEnabled || r >= 4;
    if (positive) {
      setBusy(true);
      setError(null);
      try {
        await submit({ rating: r, initialClick: first });
      } catch {
        /* The Google page still opens; the review is the customer's goal. */
      } finally {
        setBusy(false);
      }
      if (config.reviewLink) window.open(config.reviewLink, "_blank", "noopener");
      setStep("positive");
    } else {
      setStep("negative");
    }
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    setError(null);
    try {
      await submit({ rating, initialClick: initial, name, email: contact, message });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur sm:p-9">
      {children}
    </section>
  );

  const Logo = () =>
    config.companyLogoUrl ? (
      <div className="mx-auto mb-6 inline-flex max-w-full items-center justify-center rounded-2xl bg-white px-5 py-3">
        <Image src={config.companyLogoUrl} alt={config.companyName} width={320} height={120} className="h-auto max-h-24 w-auto max-w-[260px] object-contain" priority />
      </div>
    ) : (
      <p className="mb-6 text-lg font-semibold">{config.companyName}</p>
    );

  if (step === "rate") {
    return (
      <Card>
        <Logo />
        <h1 className="text-balance text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{config.mainHeadline}</h1>
        <p className="mt-3 text-[15px] text-white/60">{config.mainSubhead}</p>
        <div className="mt-8 flex justify-center gap-2" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((i) => {
            const on = (hover || rating || 0) >= i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                disabled={busy}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => pick(i as Rating)}
                className="p-1"
              >
                <svg width="52" height="52" viewBox="0 0 24 24" aria-hidden>
                  <path fill={on ? "#F5B400" : "#3a3f5c"} d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" />
                </svg>
              </button>
            );
          })}
        </div>
        {busy ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
            <Loader className="size-4 animate-spin" /> Opening Google…
          </p>
        ) : (
          <p className="mt-4 text-sm text-white/40">Tap a star to begin</p>
        )}
      </Card>
    );
  }

  if (step === "positive") {
    return (
      <Card>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{config.positiveHeadline}</h1>
        <p className="mt-3 text-[15px] text-white/60">{config.positiveSubhead}</p>
        {config.reviewLink ? (
          <a href={config.reviewLink} target="_blank" rel="noopener" className="btn btn-brand btn-lg mt-6 w-full">
            Open Google review page
          </a>
        ) : null}
        {config.voucherImageUrl ? (
          <div className="mt-6 overflow-hidden rounded-2xl">
            <Image src={config.voucherImageUrl} alt="Voucher" width={800} height={450} className="h-auto w-full" />
          </div>
        ) : null}
        <Socials links={config.socialLinks} />
      </Card>
    );
  }

  if (step === "negative") {
    return (
      <Card>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{config.negativeHeadline}</h1>
        <p className="mt-3 text-[15px] text-white/60">{config.negativeSubhead}</p>
        <form onSubmit={sendFeedback} className="mt-6 space-y-3 text-left">
          <input className="input border-white/15 bg-white/5 text-white placeholder:text-white/40" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <input className="input border-white/15 bg-white/5 text-white placeholder:text-white/40" placeholder="Email or phone (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
          <textarea
            className="textarea min-h-36 border-white/15 bg-white/5 text-white placeholder:text-white/40"
            placeholder="Tell us what happened…"
            required
            minLength={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy} className="btn btn-brand btn-lg w-full">
            {busy ? <Loader className="size-4 animate-spin" /> : null}
            Send feedback
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Thank you</h1>
      <p className="mt-3 text-[15px] text-white/60">{config.feedbackSuccessText}</p>
      <Socials links={config.socialLinks} />
    </Card>
  );
}

function Socials({ links }: { links: BusinessConfig["socialLinks"] }) {
  if (!links.length) return null;
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-sm text-white/50">Find us on social media</p>
      <div className="mt-3 flex justify-center gap-4">
        {links.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noopener" aria-label={l.type} className="grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            {l.type === "facebook" ? <Facebook className="size-5" /> : l.type === "instagram" ? <Instagram className="size-5" /> : <Globe className="size-5" />}
          </a>
        ))}
      </div>
    </div>
  );
}
