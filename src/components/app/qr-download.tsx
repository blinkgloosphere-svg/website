"use client";

import { useRef, useState } from "react";
import { QrPoster, downloadBlob, svgToPng, type PosterTheme } from "@/components/tools/qr-poster";
import { Copy, Download, Loader, Printer } from "@/components/ui/icons";

/** Poster preview, PNG download and link copy for one business. Used by admin and client. */
export function QrDownload({ businessName, url }: { businessName: string; url: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [theme, setTheme] = useState<PosterTheme>("light");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function download(px: number) {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      const png = await svgToPng(svgRef.current, px);
      downloadBlob(png, `${businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-review-qr-${theme}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] [&>*]:min-w-0">
      <div className="card flex items-center justify-center bg-bg-subtle p-6">
        <QrPoster ref={svgRef} businessName={businessName} url={url} theme={theme} width={300} />
      </div>
      <div className="space-y-6">
        <div>
          <p className="label">Review link</p>
          <div className="flex gap-2">
            <input readOnly value={url} className="input font-mono text-[13px]" />
            <button type="button" onClick={copy} className="btn btn-secondary shrink-0">
              <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div>
          <p className="label">Style</p>
          <div className="flex gap-2">
            {(["light", "dark", "brand"] as PosterTheme[]).map((t) => (
              <button key={t} type="button" onClick={() => setTheme(t)} className={`btn btn-sm capitalize ${theme === t ? "btn-primary" : "btn-secondary"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => download(1800)} disabled={busy} className="btn btn-primary">
            {busy ? <Loader className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download PNG (A6/A5)
          </button>
          <button type="button" onClick={() => download(3600)} disabled={busy} className="btn btn-secondary">
            <Printer className="size-4" /> High-res for print (A4)
          </button>
        </div>
        <p className="t-small text-fg-tertiary">The QR code encodes the review link above. Reprinting is never needed, even if the page settings change.</p>
      </div>
    </div>
  );
}
