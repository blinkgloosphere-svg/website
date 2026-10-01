"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BusinessSearch, type Suggestion } from "@/components/tools/business-search";
import { LeadGate, type LeadDraft } from "@/components/tools/lead-gate";
import { QrPoster, downloadBlob, svgToPng, type PosterTheme } from "@/components/tools/qr-poster";
import { Download, Loader } from "@/components/ui/icons";

type Details = { placeId: string; name: string; address: string; rating: number | null; reviewCount: number | null; reviewLink: string };

export function QrTool() {
  const [details, setDetails] = useState<Details | null>(null);
  const [theme, setTheme] = useState<PosterTheme>("light");
  const [loading, setLoading] = useState(false);
  const [gate, setGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  async function pick(s: Suggestion, session: string) {
    setLoading(true);
    setUnlocked(false);
    try {
      const res = await fetch(`/api/places?id=${encodeURIComponent(s.placeId)}&session=${session}`);
      const json = (await res.json()) as { details?: Details };
      setDetails(json.details ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!svgRef.current || !details) return;
    setDownloading(true);
    try {
      const png = await svgToPng(svgRef.current, 1800);
      downloadBlob(png, `${details.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-google-review-qr.png`);
    } finally {
      setDownloading(false);
    }
  }

  const draft: LeadDraft | null = details
    ? {
        tool: "qr",
        businessName: details.name,
        placeId: details.placeId,
        reviewLink: details.reviewLink,
        currentRating: details.rating,
        currentCount: details.reviewCount,
        targetRating: null,
        reviewsNeeded: null,
      }
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0">
        <label className="label" htmlFor="qr-search">
          Find your business on Google
        </label>
        <BusinessSearch onSelect={pick} autoFocus />
        {loading ? (
          <p className="t-ui mt-3 flex items-center gap-2 text-fg-secondary">
            <Loader className="size-4 animate-spin" /> Fetching your Google listing…
          </p>
        ) : null}

        {details ? (
          <div className="mt-8 space-y-6">
            <div className="card p-5">
              <p className="t-small text-fg-tertiary">Selected business</p>
              <p className="t-title-3 mt-1">{details.name}</p>
              <p className="t-ui text-fg-secondary">{details.address}</p>
              {details.rating != null ? (
                <p className="t-ui mt-2 text-fg-secondary">
                  Currently <span className="font-medium text-fg">{details.rating.toFixed(1)}★</span> from{" "}
                  <span className="font-medium text-fg">{details.reviewCount ?? 0}</span> Google reviews
                </p>
              ) : null}
            </div>

            <div>
              <p className="label">Poster style</p>
              <div className="flex gap-2">
                {(["light", "dark", "brand"] as PosterTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`btn btn-sm capitalize ${theme === t ? "btn-primary" : "btn-secondary"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {unlocked ? (
                <button type="button" onClick={download} disabled={downloading} className="btn btn-primary btn-lg">
                  {downloading ? <Loader className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Download PNG
                </button>
              ) : (
                <button type="button" onClick={() => setGate(true)} className="btn btn-primary btn-lg">
                  <Download className="size-4" />
                  Download my QR poster
                </button>
              )}
              <Link href="/#demo" className="btn btn-secondary btn-lg">
                Get it printed by Blink
              </Link>
            </div>
            <p className="t-small text-fg-tertiary">
              Free to download. The QR code opens your Google review form directly. Blink can print this on a table stand and NFC card
              for you.
            </p>
          </div>
        ) : (
          <ul className="t-ui mt-8 space-y-2 text-fg-secondary">
            <li>1. Search your business as it appears on Google Maps.</li>
            <li>2. Pick a poster style.</li>
            <li>3. Download a print-ready PNG with your review QR code.</li>
          </ul>
        )}
      </div>

      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="card flex items-center justify-center bg-bg-subtle p-6">
          <QrPoster
            ref={svgRef}
            businessName={details?.name ?? "Your Business Name"}
            url={details?.reviewLink ?? "https://reviews.blink.sg"}
            theme={theme}
            width={320}
          />
        </div>
        <p className="t-small mt-3 text-center text-fg-tertiary">Preview. Download is 1800 × 2550 px, ready for A6 or A5 print.</p>
      </div>

      {draft ? (
        <LeadGate
          open={gate}
          draft={draft}
          title="Where should we send your poster?"
          description="Enter your details to unlock the download. Blink will also send you a print-ready PDF."
          submitLabel="Unlock download"
          onClose={() => setGate(false)}
          onDone={() => {
            setGate(false);
            setUnlocked(true);
            void download();
          }}
        />
      ) : null}
    </div>
  );
}
