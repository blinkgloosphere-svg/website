"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Facebook, Globe, Instagram, Loader } from "@/components/ui/icons";
import type { BusinessConfig, Rating } from "@/lib/types";

type Props = { businessId: string; config: BusinessConfig; gatingEnabled: boolean };
type Step = "rate" | "positive" | "negative" | "done";
type Photo = { blob: Blob; url: string };

const MAX_PHOTOS = 3;
const MAX_SIDE = 1600;
const MAX_BYTES = 2_000_000;

/**
 * Shrinks a photo to at most 1600px and re-encodes it as JPEG in the browser.
 * Keeps uploads small on mobile data and drops hidden metadata such as GPS.
 */
async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  const img = bitmap ?? (await loadImage(file));
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  bitmap?.close();
  for (const q of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("too large");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [adding, setAdding] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release the preview images when the page goes away.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  /** A low rating is saved on tap; this resolves to its id so the written feedback can be added to it. */
  const tapSave = useRef<Promise<string | null> | null>(null);

  async function submit(
    payload: { rating: Rating; initialClick: Rating | null; name?: string; email?: string; message?: string; reviewId?: string },
    attach: Photo[] = [],
  ): Promise<string | null> {
    let init: RequestInit;
    if (attach.length) {
      const fd = new FormData();
      fd.set("review", JSON.stringify({ businessId, ...payload }));
      attach.forEach((p, i) => fd.append("photo", p.blob, `photo-${i + 1}.jpg`));
      init = { method: "POST", body: fd };
    } else {
      init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, ...payload }) };
    }
    const res = await fetch("/api/reviews", init);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "Could not send. Please try again.");
    }
    const j = (await res.json().catch(() => ({}))) as { id?: string | null };
    return j.id ?? null;
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
      // Record the low rating now, even if the customer leaves without writing anything.
      tapSave.current = submit({ rating: r, initialClick: first }).catch(() => null);
      setStep("negative");
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setAdding(true);
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    const added: Photo[] = [];
    let failed = 0;
    for (const f of picked) {
      try {
        const blob = await compressPhoto(f);
        added.push({ blob, url: URL.createObjectURL(blob) });
      } catch {
        failed++;
      }
    }
    setPhotos((cur) => [...cur, ...added].slice(0, MAX_PHOTOS));
    setAdding(false);
    if (fileInput.current) fileInput.current.value = "";
    if (failed) setError(failed === 1 ? "One photo could not be added. Try a different photo." : "Some photos could not be added. Try different photos.");
    else if (files.length > room) setError(`You can attach up to ${MAX_PHOTOS} photos.`);
  }

  function removePhoto(i: number) {
    setPhotos((cur) => {
      URL.revokeObjectURL(cur[i].url);
      return cur.filter((_, j) => j !== i);
    });
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    setError(null);
    try {
      const reviewId = (await tapSave.current) ?? undefined;
      await submit({ rating, initialClick: initial, name, email: contact, message, reviewId }, photos);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "rate") {
    return (
      <Card>
        <Logo config={config} />
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
          <SafeImage src={config.voucherImageUrl} alt="Voucher" width={800} height={450} className="h-auto w-full" wrapClassName="mt-6 overflow-hidden rounded-2xl" />
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
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              id="feedback-photos"
              onChange={(e) => addPhotos(e.target.files)}
              disabled={busy || adding || photos.length >= MAX_PHOTOS}
            />
            <div className="flex flex-wrap items-center gap-3">
              {photos.map((p, i) => (
                <div key={p.url} className="relative size-20 overflow-hidden rounded-xl border border-white/15">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an unsent photo */}
                  <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={busy}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-sm leading-none text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <label
                  htmlFor="feedback-photos"
                  className={`flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 text-white/60 hover:border-white/50 hover:text-white ${busy || adding ? "pointer-events-none opacity-50" : ""}`}
                >
                  {adding ? (
                    <Loader className="size-5 animate-spin" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  )}
                  <span className="text-[11px]">{photos.length ? "Add more" : "Add photos"}</span>
                </label>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-white/40">Optional. Up to {MAX_PHOTOS} photos, only seen by the business.</p>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy || adding} className="btn btn-brand btn-lg w-full">
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
      {/* Low ratings stay private by default; a customer who still wants to post publicly can. Kept small on purpose. */}
      {config.reviewLink ? (
        <a
          href={config.reviewLink}
          target="_blank"
          rel="noopener"
          className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-4 text-[13px] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Continue to Google
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
      ) : null}
      <Socials links={config.socialLinks} />
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur sm:p-9">
      {children}
    </section>
  );
}

function Logo({ config }: { config: BusinessConfig }) {
  const name = <p className="mb-6 text-lg font-semibold">{config.companyName}</p>;
  return config.companyLogoUrl ? (
    <SafeImage
      src={config.companyLogoUrl}
      alt={config.companyName}
      width={320}
      height={120}
      className="h-auto max-h-24 w-auto max-w-[260px] object-contain"
      wrapClassName="mx-auto mb-6 inline-flex max-w-full items-center justify-center rounded-2xl bg-white px-5 py-3"
      priority
      fallback={name}
    />
  ) : (
    name
  );
}

/**
 * Image that removes itself (or shows `fallback`) when the file can't be
 * loaded, e.g. a logo still hosted on a server that has gone offline, instead
 * of a broken-image icon. Also catches failures that happen before hydration.
 */
function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  wrapClassName,
  priority,
  fallback = null,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  wrapClassName: string;
  priority?: boolean;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <div className={wrapClassName}>
      <Image
        src={src}
        unoptimized={src.startsWith("http")}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onError={() => setFailed(true)}
        ref={(img) => {
          if (img && img.complete && img.naturalWidth === 0) setFailed(true);
        }}
      />
    </div>
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
