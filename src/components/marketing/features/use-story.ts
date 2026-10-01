"use client";

import { useEffect, useRef, useState } from "react";

/** True while the element is at least `threshold` visible. */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Steps through a list of durations (ms) in a loop while `active`.
 * When inactive it rests on `restIndex`, a frame that reads well on its own.
 */
export function useSequence(durations: readonly number[], active: boolean, restIndex: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> = setTimeout(() => setIndex(0), 0);
    const next = () => {
      timer = setTimeout(() => {
        i = (i + 1) % durations.length;
        setIndex(i);
        next();
      }, durations[i]);
    };
    next();
    return () => clearTimeout(timer);
  }, [active, durations]);
  return active ? index : restIndex;
}

/** 0 to 1 progress that eases up over `rise` ms, holds for `hold` ms, then repeats. */
export function useProgressLoop(active: boolean, rise = 3200, hold = 2400) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const frame = (now: number) => {
      const t = now - start;
      if (t < rise) setP(ease(t / rise));
      else if (t < rise + hold) setP(1);
      else {
        start = now;
        setP(0);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, rise, hold]);
  return active ? p : 1;
}
