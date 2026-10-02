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

const CLIP = meta.clip; // the clip only contains the logo area, at full 4K sharpness
const HERO = meta.hero; // the hero image's area within the clip
const ORIGIN = `${meta.starOrigin.x * 100}% ${meta.starOrigin.y * 100}%`;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number, s = 2.2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

type Stage = { x: number; y: number; s: number };

/** Logo centre in clip pixels at clip time t (smoothed track measured from the clip). */
function centreAt(t: number) {
  const tr = meta.track;
  if (t <= tr[0].t) return tr[0];
  for (let i = 1; i < tr.length; i++) {
    if (t <= tr[i].t) {
      const a = tr[i - 1], b = tr[i];
      const k = (t - a.t) / (b.t - a.t);
      return { cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k };
    }
  }
  return tr[tr.length - 1];
}

/** Scale so the logo is a comfortable size, never larger than the clip's real pixels. */
function scaleFor(vw: number, vh: number) {
  return Math.min((vw * 0.78) / meta.content.maxW, (vh * 0.6) / meta.content.maxH, 0.42);
}

/** Stage position that puts the logo's centre at the centre of the screen. */
function stageAt(t: number, s: number): Stage {
  const c = centreAt(t);
  return { x: window.innerWidth / 2 - c.cx * s, y: window.innerHeight / 2 - c.cy * s, s };
}

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
    const sc = scaleFor(window.innerWidth, window.innerHeight);
    let from = stageAt(0, sc);
    const frozen = Number(new URLSearchParams(location.search).get("introT") ?? NaN);
    let raf = 0;
    let cancelled = false;
    let handoffStart = 0;
    let to: Stage | null = null;

    const tick = (now: number) => {
      const t = Number.isFinite(frozen) ? frozen : v.currentTime;
      setRestore(clamp((t - AT.restore) / AT.restoreDur));

      if (Number.isFinite(frozen)) {
        setStage(stageAt(t, sc));
        return;
      }

      if (t >= AT.handoff && !handoffStart) {
        handoffStart = now;
        v.pause();
        from = stageAt(t, sc);
        const mark = document.querySelector<HTMLElement>("[data-hero-mark]");
        const r = mark?.getBoundingClientRect();
        if (r) {
          const s2 = r.width / HERO.width;
          to = { x: r.left - HERO.left * s2, y: r.top - HERO.top * s2, s: s2 };
        } else to = from;
        html.classList.add("intro-anim");
        html.classList.remove("intro"); // hero copy rises in while the logo travels
      }

      if (handoffStart && to) {
        const p = clamp((now - handoffStart) / HANDOFF_MS);
        const e = inOutCubic(p);
        setStage({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: from.s + (to.s - from.s) * e });
        setOverlay(1 - clamp((p - FADE_FROM) / (1 - FADE_FROM)));
        if (p >= 1) {
          finish(html);
          setGone(true);
          return;
        }
      } else {
        setStage(stageAt(t, sc)); // follow the logo as it moves in the clip
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

  const layer = "absolute inset-0 size-full";

  return (
    <div className="intro-overlay pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-white" style={{ opacity: overlay }} />
      <div
        className="absolute left-0 top-0"
        style={{
          width: CLIP.w,
          height: CLIP.h,
          transform: stage ? `translate3d(${stage.x}px, ${stage.y}px, 0) scale(${stage.s})` : undefined,
          transformOrigin: "0 0",
          visibility: stage ? "visible" : "hidden",
          willChange: "transform",
        }}
      >
        <video ref={video} className={layer} src="/video/intro.mp4" muted playsInline preload="auto" />
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
