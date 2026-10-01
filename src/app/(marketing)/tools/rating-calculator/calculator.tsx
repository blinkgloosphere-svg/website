"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BusinessSearch, type Suggestion } from "@/components/tools/business-search";
import { LeadGate, type LeadDraft } from "@/components/tools/lead-gate";
import { Stars } from "@/components/ui/stars";
import { Loader } from "@/components/ui/icons";

type Details = { placeId: string; name: string; address: string; rating: number | null; reviewCount: number | null; reviewLink: string };

function needed(current: number, count: number, target: number): number | null {
  if (target <= current) return 0;
  if (target >= 5) return null;
  return Math.ceil((count * (target - current)) / (5 - target));
}

export function RatingCalculator() {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState(4.7);
  const [gate, setGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  async function pick(s: Suggestion, session: string) {
    setLoading(true);
    setUnlocked(false);
    try {
      const res = await fetch(`/api/places?id=${encodeURIComponent(s.placeId)}&session=${session}`);
      const json = (await res.json()) as { details?: Details };
      setDetails(json.details ?? null);
      if (json.details?.rating != null) setTarget(Math.min(4.9, Math.round((json.details.rating + 0.3) * 10) / 10));
    } finally {
      setLoading(false);
    }
  }

  const result = useMemo(() => {
    if (!details || details.rating == null) return null;
    return needed(details.rating, details.reviewCount ?? 0, target);
  }, [details, target]);

  const draft: LeadDraft | null = details
    ? {
        tool: "calculator",
        businessName: details.name,
        placeId: details.placeId,
        reviewLink: details.reviewLink,
        currentRating: details.rating,
        currentCount: details.reviewCount,
        targetRating: target,
        reviewsNeeded: result,
      }
    : null;

  const options = [4.0, 4.2, 4.5, 4.7, 4.8, 4.9];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0">
        <label className="label">Find your business on Google</label>
        <BusinessSearch onSelect={pick} autoFocus />
        {loading ? (
          <p className="t-ui mt-3 flex items-center gap-2 text-fg-secondary">
            <Loader className="size-4 animate-spin" /> Reading your Google rating…
          </p>
        ) : null}

        {details ? (
          <div className="mt-8 space-y-6">
            <div className="card p-5">
              <p className="t-small text-fg-tertiary">Your Google listing today</p>
              <p className="t-title-3 mt-1">{details.name}</p>
              <p className="t-ui text-fg-secondary">{details.address}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="t-title-1">{details.rating?.toFixed(1) ?? "–"}</span>
                <Stars value={details.rating ?? 0} size={22} />
                <span className="t-ui text-fg-secondary">({details.reviewCount ?? 0} reviews)</span>
              </div>
            </div>

            <div>
              <p className="label">Where do you want to be?</p>
              <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setTarget(o)}
                    className={`btn btn-sm ${target === o ? "btn-primary" : "btn-secondary"}`}
                  >
                    {o.toFixed(1)}★
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ul className="t-ui mt-8 space-y-2 text-fg-secondary">
            <li>1. Search your business as it appears on Google Maps.</li>
            <li>2. See your current rating and review count.</li>
            <li>3. Pick a target and find out exactly how many 5-star reviews you need.</li>
          </ul>
        )}
      </div>

      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="card-dark p-7">
          <p className="t-small text-dark-fg-secondary">5-star reviews needed</p>
          {details && details.rating != null ? (
            <>
              <p className="mt-2 text-[64px] font-semibold leading-none tracking-tight">
                {unlocked ? (result == null ? "∞" : result) : <span className="blur-sm select-none">{result == null ? "∞" : Math.max(9, result ?? 0)}</span>}
              </p>
              <p className="t-ui mt-3 text-dark-fg-secondary">
                to move <span className="text-white">{details.name}</span> from {details.rating.toFixed(1)}★ to {target.toFixed(1)}★
              </p>
              {unlocked && result != null && details.reviewCount ? (
                <div className="mt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(100, Math.round((details.reviewCount / (details.reviewCount + result)) * 100))}%` }} />
                  </div>
                  <p className="t-small mt-2 text-dark-fg-secondary">
                    {details.reviewCount} reviews now → {details.reviewCount + result} after
                  </p>
                </div>
              ) : null}
              {unlocked && result === null ? <p className="t-small mt-3 text-dark-fg-secondary">A perfect 5.0 is not reachable once any lower rating exists. Aim for 4.9.</p> : null}
              {!unlocked ? (
                <button type="button" onClick={() => setGate(true)} className="btn btn-brand mt-6 w-full">
                  Reveal my number
                </button>
              ) : (
                <Link href="/#demo" className="btn btn-brand mt-6 w-full">
                  Get these reviews with Blink
                </Link>
              )}
            </>
          ) : (
            <p className="mt-2 text-[64px] font-semibold leading-none tracking-tight text-white/20">–</p>
          )}
        </div>
        <p className="t-small mt-3 text-center text-fg-tertiary">Based on Google&apos;s simple average. Actual display rounds to one decimal.</p>
      </div>

      {draft ? (
        <LeadGate
          open={gate}
          draft={draft}
          title="Where should we send your plan?"
          description="Enter your details to reveal the number and get a short plan to reach it."
          submitLabel="Reveal my number"
          onClose={() => setGate(false)}
          onDone={() => {
            setGate(false);
            setUnlocked(true);
          }}
        />
      ) : null}
    </div>
  );
}
