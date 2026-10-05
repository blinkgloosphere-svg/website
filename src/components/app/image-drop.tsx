"use client";

import { useRef, useState } from "react";
import { Loader } from "@/components/ui/icons";
import type { UploadResult } from "@/lib/upload-image";

type Props = {
  /** Form field that receives the uploaded image's address. */
  name: string;
  label: string;
  hint?: string;
  initial: string | null;
  disabled?: boolean;
  upload: (fd: FormData) => Promise<UploadResult>;
};

/** Drop an image (or tap to choose one); it uploads at once and its address is saved with the form. */
export function ImageDrop({ name, label, hint, initial, disabled, upload }: Props) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const off = disabled || busy;

  async function send(file: File | undefined) {
    if (!file || off) return;
    setError(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await upload(fd).catch(() => ({ ok: false as const, error: "Upload failed. Please try again." }));
    setBusy(false);
    if (res.ok) setUrl(res.url);
    else setError(res.error);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <p className="label">{label}</p>
      <input type="hidden" name={name} value={url} />
      <div
        role="button"
        tabIndex={off ? -1 : 0}
        aria-label={`${url ? "Replace" : "Upload"} ${label.toLowerCase()}`}
        aria-disabled={off}
        onClick={() => !off && input.current?.click()}
        onKeyDown={(e) => {
          if (!off && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!off) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void send(e.dataTransfer.files?.[0]);
        }}
        className={`flex min-h-[132px] items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
          over ? "border-ink bg-brand-soft" : "border-border bg-bg-subtle hover:border-fg-tertiary"
        } ${off ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
          {busy ? (
            <Loader className="size-5 animate-spin text-fg-tertiary" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded image at any address
            <img src={url} alt="" className="size-full object-contain p-1" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-fg-tertiary" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="1.8" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className="min-w-0 text-left">
          <p className="t-ui font-medium text-fg">{busy ? "Uploading…" : over ? "Drop to upload" : url ? "Drop a new image to replace" : "Drag a photo here"}</p>
          <p className="t-small text-fg-tertiary">or tap to choose · PNG, JPG, WEBP or SVG, under 5 MB</p>
          {url && !busy ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUrl("");
              }}
              disabled={off}
              className="t-small mt-2 font-medium text-danger hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1} onChange={(e) => void send(e.target.files?.[0])} disabled={off} />
      {error ? <p className="t-small mt-1.5 text-danger">{error}</p> : hint ? <p className="t-small mt-1.5 text-fg-tertiary">{hint}</p> : null}
    </div>
  );
}
