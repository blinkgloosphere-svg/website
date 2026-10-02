"use client";

import { useEffect, useRef, useState } from "react";
import { GROUP, META, T, introFrame, type IntroFrame } from "./timeline";

const SRC = { full: "/brand/intro-full.png", empty: "/brand/intro-nostar.png", star: "/brand/intro-star.png" };
const STAR_PATH = "M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z";
const ORIGIN = `${META.star.cx * 100}% ${META.star.cy * 100}%`;
export const INTRO_SEEN_KEY = "blink-intro-seen";

/**
 * Runs before first paint (from the root layout). Turns the intro on for the
 * home page once per browser session, never for reduced-motion users.
 * `?intro=1` forces it; `?introT=1500` freezes it at that moment (for reviewing).
 */
export const INTRO_BOOT = `try{var d=document.documentElement,q=location.search;if(location.pathname==="/"&&(q.indexOf("intro=1")>-1||(!sessionStorage.getItem("${INTRO_SEEN_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches))){d.classList.add("intro","intro-mark")}}catch(e){}`;

type Box = { x: number; y: number; s: number };

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

/** Full-screen logo intro built from the official logo; lands on the hero logo and stars, then removes itself. */
export function IntroPreloader() {
  const [frame, setFrame] = useState<IntroFrame>(() => introFrame(0));
  const [box, setBox] = useState<Box | null>(null);
  const [gone, setGone] = useState(false);
  const from = useRef<Box | null>(null);
  const to = useRef<Box | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro")) {
      const r = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(r);
    }
    // Landing mid-page (e.g. reload after scrolling): skip straight to the page.
    if (window.scrollY > 40) {
      finish(html);
      const r = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(r);
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(1.7, (vw * 0.72) / GROUP.width, (vh * 0.56) / GROUP.height);
    from.current = { x: (vw - GROUP.width * s) / 2, y: (vh - GROUP.height * s) / 2, s };

    const frozen = Number(new URLSearchParams(location.search).get("introT") ?? NaN);
    let raf = 0;
    let start = 0;
    let handedOff = false;
    let cancelled = false;

    const tick = (now: number) => {
      if (!start) {
        start = now;
        setBox(from.current);
      }
      const t = Number.isFinite(frozen) ? frozen : now - start;
      const f = introFrame(t);

      if (t >= T.handoff[0] && !handedOff && !Number.isFinite(frozen)) {
        handedOff = true;
        const mark = document.querySelector<HTMLElement>("[data-hero-mark]");
        const r = mark?.getBoundingClientRect();
        to.current = r ? { x: r.left, y: r.top, s: r.width / GROUP.width } : from.current;
        html.classList.add("intro-anim");
        html.classList.remove("intro"); // hero copy rises in while the logo travels
      }
      if (to.current && from.current) {
        const p = f.handoff;
        const a = from.current;
        const b = to.current;
        setBox({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s: a.s + (b.s - a.s) * p });
      }
      setFrame(f);

      if (Number.isFinite(frozen)) return;
      if (f.done) {
        finish(html);
        setGone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    // Wait for the three logo layers so nothing pops in half-loaded (max 1.5 s).
    const imgs = Object.values(SRC).map((src) => {
      const i = new Image();
      i.src = src;
      return i.decode().catch(() => undefined);
    });
    Promise.race([Promise.all(imgs), new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (!cancelled) raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (gone) return null;

  const { logo, flyer, popper, stars, overlay } = frame;
  const b = box;

  return (
    <div className="intro-overlay pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <div className="absolute inset-0 bg-white" style={{ opacity: overlay }} />
      {b ? (
        <div
          className="absolute left-0 top-0"
          style={{ width: GROUP.width, height: GROUP.height, transform: `translate3d(${b.x}px, ${b.y}px, 0) scale(${b.s})`, transformOrigin: "0 0", willChange: "transform" }}
        >
          {/* logo: full, or with the star cut out while it is away */}
          <div className="absolute left-0 top-0" style={{ width: GROUP.logoW, height: GROUP.logoH, opacity: logo.opacity, transform: `scale(${logo.scale})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC.full} alt="" className="absolute inset-0 size-full" style={{ opacity: logo.full ? 1 : 0 }} draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC.empty} alt="" className="absolute inset-0 size-full" style={{ opacity: logo.full ? 0 : 1 }} draggable={false} />
            {popper.visible ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={SRC.star}
                alt=""
                className="absolute inset-0 size-full"
                style={{ opacity: popper.opacity, transform: `scale(${popper.scale})`, transformOrigin: ORIGIN }}
                draggable={false}
              />
            ) : null}
          </div>

          {/* the star that drops out of the bag */}
          {flyer.visible ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={SRC.star}
              alt=""
              className="absolute left-0 top-0"
              style={{
                width: GROUP.logoW,
                height: GROUP.logoH,
                opacity: flyer.opacity,
                transform: `translateY(${flyer.dy}px) rotate(${flyer.rotate}deg) scale(${flyer.scale})`,
                transformOrigin: ORIGIN,
              }}
              draggable={false}
            />
          ) : null}

          {/* rating stars */}
          {stars.map((st, i) => (
            <svg
              key={i}
              width={GROUP.starSize}
              height={GROUP.starSize}
              viewBox="0 0 24 24"
              className="absolute"
              style={{
                left: GROUP.slotX(i) - GROUP.starSize / 2,
                top: GROUP.rowTop,
                opacity: st.opacity,
                transform: `translateX(${st.dx}px) scale(${st.scale})`,
              }}
            >
              <path d={STAR_PATH} fill="#F5B400" />
            </svg>
          ))}
        </div>
      ) : null}
    </div>
  );
}
