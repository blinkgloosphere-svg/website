"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { encodeQr } from "@/lib/qr";
import { PoweredByBlink } from "@/components/ui/powered-by";
import s from "./features.module.css";
import { useInView, useProgressLoop, useReducedMotion, useSequence } from "./use-story";

/* ================================================================ */
/* Shared                                                            */
/* ================================================================ */

const STAR = "M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z";

function Star({ on, size = 16, dim = "#3a3d46", className }: { on: boolean; size?: number; dim?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path d={STAR} fill={on ? "#FFB81C" : dim} className={s.star} />
    </svg>
  );
}

function StarRow({ value, size = 12, dim = "#d6d9e0" }: { value: number; size?: number; dim?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} on={i <= value} size={size} dim={dim} />
      ))}
    </span>
  );
}

function Card({ title, text, children, className }: { title: string; text: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={cn(s.card, className)}>
      <div className={s.dots} />
      {children}
      <p className={s.caption}>
        <b>{title}.</b> {text}
      </p>
    </article>
  );
}

/** Starts the story when the card scrolls into view, unless the visitor prefers reduced motion. */
function useStage() {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  const reduced = useReducedMotion();
  return { ref, active: inView && !reduced, inView };
}

/* ================================================================ */
/* 1. Smart review routing                                            */
/* ================================================================ */

type RouteStep = { stars: number; route: "google" | "private" | null };
const ROUTE_STEPS: RouteStep[] = [
  { stars: 0, route: null },
  { stars: 1, route: null },
  { stars: 2, route: null },
  { stars: 3, route: null },
  { stars: 4, route: null },
  { stars: 5, route: null },
  { stars: 5, route: "google" },
  { stars: 0, route: null },
  { stars: 1, route: null },
  { stars: 2, route: null },
  { stars: 2, route: "private" },
];
const ROUTE_MS = [900, 170, 170, 170, 170, 600, 2800, 700, 170, 700, 3000] as const;

function RoutingCard() {
  const { ref, active } = useStage();
  const i = useSequence(ROUTE_MS, active, 6);
  const step = ROUTE_STEPS[i];

  return (
    <Card title="Smart review routing" text="Happy customers go straight to Google. Unhappy ones reach you first, in private.">
      <div className={s.beam} />
      <div className={s.beamCore} />
      <div ref={ref} className={cn(s.stage, "pb-16")}>
        <div className="relative w-full max-w-[320px]">
          <div className={cn(s.panel, s.panelEdge, "p-3")}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-1.5 pb-3 pt-1">
              <span className="grid size-7 place-items-center rounded-md bg-[#FFB81C] text-[11px] font-bold text-[#0b0b0c]">CL</span>
              <span className="text-[14px] text-white/85">How was your visit today?</span>
              <span className="ml-auto text-white/30" aria-hidden>
                ✕
              </span>
            </div>

            <p className={cn(s.label, "px-1.5 pt-3")}>Copper Ladle Kitchen</p>
            <div className="flex justify-between px-1.5 pb-3 pt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} on={n <= step.stars} size={34} className={n <= step.stars ? s.starOn : undefined} />
              ))}
            </div>

            <p className={cn(s.label, "px-1.5 pb-1.5 pt-1")}>Routed to</p>
            <div className={cn(s.route, step.route === "google" && s.routeOn)}>
              <GoogleG />
              Google review page
              <span className={cn(s.kbd, "ml-auto")}>4–5★</span>
              <Check className={s.check} />
            </div>
            <div className={cn(s.route, step.route === "private" && s.routeOn)}>
              <Lock />
              Private note to the owner
              <span className={cn(s.kbd, "ml-auto")}>1–3★</span>
              <Check className={s.check} />
            </div>
          </div>

          <div className={cn(s.toast, "bg-white text-[#0b0c0e]", step.route === "google" && s.toastShow)}>
            <GoogleG /> Opening Google reviews…
          </div>
          <div className={cn(s.toast, "bg-[#1d1f25] text-white ring-1 ring-white/10", step.route === "private" && s.toastShow)}>
            <Lock /> Sent privately to the owner
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================================================================ */
/* 2. Client dashboard: live feed                                     */
/* ================================================================ */

type FeedItem = { name: string; initials: string; color: string; stars: number; text: string; dest: "google" | "private" };
const FEED: FeedItem[] = [
  { name: "Sarah Lim", initials: "SL", color: "#f97316", stars: 5, text: "Fast, friendly and spotless. We'll be back!", dest: "google" },
  { name: "Daniel Tan", initials: "DT", color: "#6366f1", stars: 2, text: "Waited 25 minutes for our order on Saturday.", dest: "private" },
  { name: "Mei Ling", initials: "ML", color: "#ec4899", stars: 5, text: "Best chilli pan mee in the east, hands down.", dest: "google" },
  { name: "Arjun Nair", initials: "AN", color: "#10b981", stars: 4, text: "Great value. Parking was a bit tricky.", dest: "google" },
  { name: "Grace Ho", initials: "GH", color: "#0ea5e9", stars: 5, text: "The team remembered my order. Love it.", dest: "google" },
  { name: "Ravi K.", initials: "RK", color: "#a855f7", stars: 3, text: "Food good, aircon was too cold.", dest: "private" },
];

function DashboardCard() {
  const { ref, active } = useStage();
  const [n, setN] = useState(3);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((x) => x + 1), 2600);
    return () => clearInterval(id);
  }, [active]);

  const visible = [n - 1, n - 2, n - 3, n - 4].filter((k) => k >= 0).map((k) => ({ key: k, ...FEED[k % FEED.length] }));
  const total = 149 + n;
  const isNew = n > 3;

  return (
    <Card title="Client dashboard" text="Every rating and every private message lands in one live feed, the moment it happens.">
      <div className={s.glowBlue} />
      <div ref={ref} className={cn(s.stage, "pb-0")}>
        {/* left, faded */}
        <div className={cn(s.panel, s.faded, "absolute left-[4%] top-[18%] hidden w-[210px] p-4 md:block")} aria-hidden>
          <div className="flex items-center justify-between text-[13px] text-white/70">
            Yesterday <Check className="size-4 text-white/50" />
          </div>
          {[4, 5, 5].map((v, i) => (
            <div key={i} className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
              <StarRow value={v} size={10} dim="#3a3d46" />
              <div className="mt-2 h-1.5 w-[80%] rounded bg-white/10" />
              <div className="mt-1.5 h-1.5 w-[55%] rounded bg-white/10" />
            </div>
          ))}
        </div>

        {/* centre: live feed */}
        <div className={cn(s.today, "relative z-10 w-full max-w-[340px] self-end p-4 pb-0")}>
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold tracking-tight">Today</span>
            <span className={s.live}>
              <span className={s.liveDot} /> Live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/70 px-3 py-2">
              <div className="text-[11px] text-[#62666d]">Total reviews</div>
              <div key={total} className={cn("text-[20px] font-semibold tracking-tight", isNew && s.bump)}>
                {total}
              </div>
            </div>
            <div className="rounded-lg bg-white/70 px-3 py-2">
              <div className="text-[11px] text-[#62666d]">Average</div>
              <div className="flex items-center gap-1 text-[20px] font-semibold tracking-tight">
                4.8 <Star on size={16} />
              </div>
            </div>
          </div>
          <div className={cn(s.feed, "mt-3 h-[236px] overflow-hidden")}>
            {visible.map((r, idx) => (
              <div key={r.key} className={cn(s.item, "mb-2.5 px-3.5 py-3", idx === 0 && isNew && s.itemEnter)}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(s.chip, r.dest === "google" ? "bg-[#e9f7ef] text-[#1f9d55]" : "bg-[#fff4e0] text-[#b26b00]")}
                  >
                    {r.dest === "google" ? "Posted on Google" : "Private feedback"}
                  </span>
                  <span className="ml-auto text-[11px] text-[#8a8f98]">{idx === 0 ? "just now" : `${idx * 4}m ago`}</span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-snug text-[#1b1c1f]">{r.text}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: r.color }}>
                    {r.initials}
                  </span>
                  <span className="text-[12px] text-[#62666d]">{r.name}</span>
                  <span className="ml-auto">
                    <StarRow value={r.stars} size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right, faded */}
        <div className={cn(s.panel, s.fadedRight, "absolute right-[3%] top-[24%] hidden w-[220px] p-4 md:block")} aria-hidden>
          <div className="text-[13px] text-white/70">Reply to feedback</div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/45">
            Hi Daniel, thank you for telling us. We&apos;ve added a second cook on weekends…
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/60">Private</span>
            <span className="ml-auto rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#0b0c0e]">Send</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================================================================ */
/* 3. QR code and NFC: a scan at the table                            */
/* ================================================================ */

const SCAN_MS = [2000, 2600, 700] as const; // scanning, reviewed, reset

function QrCard() {
  const { ref, active } = useStage();
  const phase = useSequence(SCAN_MS, active, 1); // 0 scan, 1 done, 2 idle
  const [scans, setScans] = useState(14);
  const first = useRef(true);
  useEffect(() => {
    if (!active) return;
    if (phase === 1) {
      if (first.current) first.current = false;
      else setScans((c) => (c >= 22 ? 14 : c + 1));
    }
  }, [phase, active]);

  const qr = useMemo(() => {
    const m = encodeQr("https://reviews.blink.sg/r/table-11");
    let d = "";
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.modules[y][x]) d += `M${x} ${y}h1v1h-1z`;
    return { size: m.size, d };
  }, []);

  const bars = [5, 8, 11, 7, scans];
  const done = phase === 1;

  return (
    <Card title="QR code and NFC" text="A branded stand on every table. One scan opens the review page, and the review lands in your feed.">
      <div className={s.glowMixed} />
      <div className={s.hourLines} aria-hidden />
      <div className={cn(s.hours, "hidden sm:flex")} aria-hidden>
        <span>9 AM</span>
        <span>10 AM</span>
        <span>11 AM</span>
        <span>12 PM</span>
        <span>1 PM</span>
      </div>

      <div ref={ref} className={cn(s.stage, "gap-6 pb-4 pt-8 sm:pl-24")}>
        {/* the table stand */}
        <div className={cn(s.stand, "relative w-[220px] shrink-0 px-5 pb-4 pt-4 text-center")}>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-[#62666d]">TABLE 11</div>
          <div className="mt-0.5 text-[17px] font-bold tracking-tight">Review us on Google</div>
          <div className="mt-1 flex justify-center">
            <StarRow value={5} size={13} />
          </div>
          <div className={cn(s.qrBox, "mx-auto mt-2.5 size-[128px] bg-white p-1.5")}>
            <svg viewBox={`0 0 ${qr.size} ${qr.size}`} className="size-full" shapeRendering="crispEdges" aria-hidden>
              <path d={qr.d} fill="#0b0c0e" />
            </svg>
            <span className={cn(s.corner, done && s.cornerOk, "left-0 top-0 rounded-tl-md border-l-[3px] border-t-[3px]")} />
            <span className={cn(s.corner, done && s.cornerOk, "right-0 top-0 rounded-tr-md border-r-[3px] border-t-[3px]")} />
            <span className={cn(s.corner, done && s.cornerOk, "bottom-0 left-0 rounded-bl-md border-b-[3px] border-l-[3px]")} />
            <span className={cn(s.corner, done && s.cornerOk, "bottom-0 right-0 rounded-br-md border-b-[3px] border-r-[3px]")} />
            <span key={`laser-${phase === 0 ? scans : "off"}`} className={cn(s.laser, phase === 0 && active && s.laserOn)} />
            <span className={cn(s.flash, done && s.flashOn)}>
              <span className="grid size-12 place-items-center rounded-full bg-[#FFB81C]">
                <Check className="size-6 text-[#0b0b0c]" />
              </span>
            </span>
          </div>
          <div className="mt-2.5 text-[11.5px] font-medium text-[#1b1c1f]">Scan to leave a review on Google</div>
          <div className="mt-2 flex justify-center">
            <PoweredByBlink size="sm" className="!h-7 !text-[12px]" />
          </div>
        </div>

        {/* right column: notification + lunch rush */}
        <div className="hidden w-[250px] shrink-0 flex-col gap-4 md:flex">
          <div className={cn(s.notify, done && s.notifyOn, "p-3.5")}>
            <div className="flex items-center gap-2 text-[11px] text-[#62666d]">
              <span className="grid size-5 place-items-center rounded-md bg-[#FFB81C] text-[9px] font-bold text-[#0b0b0c]">B</span>
              Blink · now
            </div>
            <div className="mt-1.5 text-[13.5px] font-semibold">New 5★ review from Table 11</div>
            <div className="mt-1 flex items-center gap-2">
              <StarRow value={5} size={12} />
              <span className="text-[12px] text-[#62666d]">Posted on Google</span>
            </div>
          </div>

          <div className={cn(s.panel, "p-4")}>
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-medium text-white">Lunch rush</span>
              <span className="text-[11px] text-white/40">11:30 – 1:00 pm</span>
            </div>
            <div className="mt-4 flex h-[78px] items-end gap-2.5">
              {bars.map((h, i) => (
                <div key={i} className={cn(s.bar, i < bars.length - 1 && s.barDim)} style={{ height: `${Math.min(100, (h / 22) * 100)}%` }} />
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[11px] text-white/40">Scans today</span>
              <span key={scans} className={cn("text-[22px] font-semibold tracking-tight text-white", s.bump)}>
                {scans}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================================================================ */
/* 4. Review planner                                                  */
/* ================================================================ */

function PlannerCard() {
  const { ref, active, inView } = useStage();
  const p = useProgressLoop(active, 3400, 2600);
  const start = 4.3;
  const goal = 4.8;
  const rating = start + (goal - start) * p;
  const reviews = Math.round(38 * p);
  const R = 84;
  const C = 2 * Math.PI * R;

  return (
    <Card title="Review planner" text="Pick the rating you want. Blink shows how many reviews it takes, and tracks you there week by week.">
      <div ref={ref} className={cn(s.stage, !inView && s.paused)}>
        <div className="relative grid place-items-center">
          <div className={s.halo} aria-hidden />
          <div className={s.haloRing} aria-hidden />
          <div className={s.dial}>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 196 196" aria-hidden>
              <circle cx="98" cy="98" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="98"
                cy="98"
                r={R}
                fill="none"
                stroke="url(#plannerGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - p)}
              />
              <defs>
                <linearGradient id="plannerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#ff8a3d" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[44px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
                {rating.toFixed(1)}
                <Star on size={26} />
              </div>
              <div className="mt-2 text-[12px] text-white/45">Goal {goal.toFixed(1)}★</div>
            </div>
            <span className={s.badge}>+{reviews}</span>
          </div>
        </div>
      </div>
      <div className="-mt-2 mb-4 flex justify-center gap-1.5 px-6" aria-hidden>
        {["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((w, i) => {
          const on = p >= (i + 1) / 4 - 0.01;
          return (
            <span
              key={w}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] transition-colors duration-300",
                on ? "bg-[#FFB81C] font-medium text-[#0b0b0c]" : "bg-white/[0.06] text-white/40",
              )}
            >
              {w}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

/* ================================================================ */
/* Icons                                                             */
/* ================================================================ */

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden className="shrink-0">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

/* ================================================================ */
/* Grid                                                              */
/* ================================================================ */

export function FeatureCards() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.75fr]">
        <RoutingCard />
        <DashboardCard />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.75fr_1fr]">
        <QrCard />
        <PlannerCard />
      </div>
    </div>
  );
}
