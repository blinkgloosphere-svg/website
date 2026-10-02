"use client";

import { useEffect, useRef, useState } from "react";
import meta from "../../../public/video/intro-meta.json";

export const INTRO_SEEN_KEY = "blink-intro-seen";

/**
 * Runs before first paint (from the root layout). Turns the intro on for the
 * home page once per browser session, never for reduced-motion users.
 * `?intro=1` forces it (for reviewing).
 */
export const INTRO_BOOT = `try{var d=document.documentElement,q=location.search;if(location.pathname==="/"&&(q.indexOf("intro=1")>-1||(!sessionStorage.getItem("${INTRO_SEEN_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches))){d.classList.add("intro","intro-mark")}}catch(e){}`;

/** Seconds in the clip. */
const AT = {
  restore: 3.0, // star and inner lines come back into the bag
  restoreDur: 0.5,
  handoff: 4.0, // clip is still from 3.4 s; glide onto the hero
};
const HANDOFF_MS = 750;
const FADE_FROM = 0.3; // overlay fade starts at this fraction of the hand-off

const F = meta.frame;
const CROP = meta.crop;
const ORIGIN = `${meta.starOrigin.x * 100}% ${meta.starOrigin.y * 100}%`;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number, s = 2.2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

type Stage = { x: number; y: number; w: number };

function finish(html: HTMLElement) {
  html.classList.add("intro-anim");
  html.classList.remove("intro", "intro-mark");
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
  setTimeout(() => html.classList.remove("intro-anim"), 1600);
}

/** Stage (the full video frame) sized so the logo group is a comfortable width, centred on screen. */
function startStage(): Stage {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const groupW = Math.min(vw * 0.72, vh * 0.62 * (CROP.width / CROP.height), 560);
  const w = (groupW / CROP.width) * F.w;
  const s = w / F.w;
  const cx = (CROP.left + CROP.width / 2) * s;
  const cy = (CROP.top + CROP.height / 2) * s;
  return { x: vw / 2 - cx, y: vh / 2 - cy, w };
}

/** Plays the Blink logo clip full screen, restores the star at 3 s, then lands on the hero logo. */
export function IntroPreloader() {
  const video = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [restore, setRestore] = useState(0);
  const [overlay, setOverlay] = useState(1);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const done = () => requestAnimationFrame(() => setGone(true));
    if (!html.classList.contains("intro")) {
      done();
      return;
    }
    if (window.scrollY > 40) {
      finish(html);
      done();
      return;
    }

    const v = video.current;
    if (!v) return;
    const from = startStage();
    const frozen = Number(new URLSearchParams(location.search).get("introT") ?? NaN);
    let raf = 0;
    let cancelled = false;
    let handoffStart = 0;
    let to: Stage | null = null;

    const tick = (now: number) => {
      const t = Number.isFinite(frozen) ? frozen : v.currentTime;
      setRestore(clamp((t - AT.restore) / AT.restoreDur));

      if (Number.isFinite(frozen)) {
        setStage(from);
        return;
      }

      if (t >= AT.handoff && !handoffStart) {
        handoffStart = now;
        v.pause();
        const mark = document.querySelector<HTMLElement>("[data-hero-mark]");
        const r = mark?.getBoundingClientRect();
        if (r) {
          const w = (r.width / CROP.width) * F.w;
          const s = w / F.w;
          to = { x: r.left - CROP.left * s, y: r.top - CROP.top * s, w };
        } else to = from;
        html.classList.add("intro-anim");
        html.classList.remove("intro"); // hero copy rises in while the logo travels
      }

      if (handoffStart && to) {
        const p = clamp((now - handoffStart) / HANDOFF_MS);
        const e = inOutCubic(p);
        setStage({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e });
        setOverlay(1 - clamp((p - FADE_FROM) / (1 - FADE_FROM)));
        if (p >= 1) {
          finish(html);
          setGone(true);
          return;
        }
      } else {
        setStage(from);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (cancelled) return;
      if (Number.isFinite(frozen)) {
        v.currentTime = frozen;
        v.pause();
        raf = requestAnimationFrame(tick);
        return;
      }
      v.play()
        .then(() => {
          if (!cancelled) raf = requestAnimationFrame(tick);
        })
        // Autoplay blocked (e.g. low-power mode): skip straight to the page.
        .catch(() => {
          finish(html);
          setGone(true);
        });
    };

    // Start as soon as the clip can play; give up after 2.5 s on a slow connection.
    const fallback = setTimeout(() => {
      if (v.readyState < 3) {
        cancelled = true;
        finish(html);
        setGone(true);
      }
    }, 2500);
    if (v.readyState >= 3) start();
    else v.addEventListener("canplay", start, { once: true });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      cancelAnimationFrame(raf);
      v.removeEventListener("canplay", start);
    };
  }, []);

  if (gone) return null;

  const h = stage ? (stage.w * F.h) / F.w : 0;
  const layer = "absolute inset-0 size-full";

  return (
    <div className="intro-overlay pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-white" style={{ opacity: overlay }} />
      <div
        className="absolute left-0 top-0"
        style={
          stage
            ? { width: stage.w, height: h, transform: `translate3d(${stage.x}px, ${stage.y}px, 0)`, willChange: "transform" }
            : { width: "100%", height: "100%" }
        }
      >
        <video ref={video} className={`${layer} object-cover`} muted playsInline preload="auto" style={{ opacity: stage ? 1 : 0 }}>
          <source src="/video/intro-720.mp4" type="video/mp4" media="(max-width: 767px)" />
          <source src="/video/intro.mp4" type="video/mp4" />
        </video>
        {/* restored inner lines and star, fitted to the clip's bag */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/video/intro-inner.png" alt="" className={layer} style={{ opacity: clamp(restore * 2) }} draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/video/intro-star.png"
          alt=""
          className={layer}
          style={{ opacity: clamp(restore * 4), transform: `scale(${restore > 0 ? outBack(restore) : 0})`, transformOrigin: ORIGIN }}
          draggable={false}
        />
      </div>
    </div>
  );
}
