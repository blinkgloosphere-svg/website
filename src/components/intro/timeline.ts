/**
 * Blink logo intro, as a pure function of time (ms), built from the official
 * logo layers in public/brand/intro-*.png.
 *
 * Story: logo appears → the star lifts out of the bag → drops and becomes the
 * middle rating star → the other four stars slide out → a new star pops back
 * into the bag → hold → hand-off onto the hero.
 */

export const META = {
  /** Logo image width / height (public/brand/intro-*.png). */
  aspect: 1.2747,
  /** Star centre and width as fractions of the logo frame. */
  star: { cx: 0.4994, cy: 0.415, w: 0.3488 },
};

/** Group layout in "hero pixels": logo 240 wide, stars 36 with 4 gap, 24 below the logo. */
export const GROUP = (() => {
  const logoW = 240;
  const logoH = logoW / META.aspect;
  const starSize = 36;
  const starGap = 4;
  const rowTop = logoH + 24;
  const rowW = starSize * 5 + starGap * 4;
  const rowLeft = (logoW - rowW) / 2;
  const slotX = (i: number) => rowLeft + i * (starSize + starGap) + starSize / 2;
  return { logoW, logoH, starSize, starGap, rowTop, rowW, rowLeft, slotX, width: logoW, height: rowTop + starSize };
})();

export const T = {
  logoIn: [0, 450],
  lift: [600, 850],
  drop: [850, 1330],
  land: [1280, 1460],
  spread: [1420, 1520], // start times for the inner pair and the outer pair
  spreadDur: 380,
  popBack: [1800, 2280],
  handoff: [2500, 3200],
  fade: [2750, 3200],
  end: 3260,
} as const;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x: number, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
};
const prog = (t: number, [a, b]: readonly [number, number]) => clamp((t - a) / (b - a));

export type IntroFrame = {
  logo: { opacity: number; scale: number; full: boolean };
  /** Sparkle that leaves the bag. Offsets in group px from its home position. */
  flyer: { visible: boolean; opacity: number; dy: number; scale: number; rotate: number };
  /** Sparkle that pops back into the bag. */
  popper: { visible: boolean; opacity: number; scale: number };
  /** Five rating stars: x offset (group px) from their slot, scale, opacity. */
  stars: Array<{ opacity: number; scale: number; dx: number }>;
  /** 0..1 progress of the move onto the hero, and overlay opacity. */
  handoff: number;
  overlay: number;
  done: boolean;
};

export function introFrame(t: number): IntroFrame {
  const starHomeY = META.star.cy * GROUP.logoH;
  const middleY = GROUP.rowTop + GROUP.starSize / 2;
  const sparkleW = META.star.w * GROUP.logoW;

  const li = ease.outCubic(prog(t, T.logoIn));
  const emptyBag = t >= T.lift[1] && t < T.popBack[1];

  // flyer: lift, then drop to the middle slot while shrinking and turning
  const pl = ease.outCubic(prog(t, T.lift));
  let fs = 1 + 0.14 * pl;
  let fy = -10 * pl;
  let fr = 0;
  if (t >= T.drop[0]) {
    const pd = ease.inOutCubic(prog(t, T.drop));
    fy = -10 + (middleY - starHomeY + 10) * pd;
    fs = 1.14 + ((GROUP.starSize * 1.05) / sparkleW - 1.14) * pd;
    fr = 90 * pd;
  }
  const fo = 1 - prog(t, T.land);
  const flyerVisible = t >= T.lift[0] && t < T.land[1];

  // rating stars
  const landP = prog(t, T.land);
  const stars = [0, 1, 2, 3, 4].map((i) => {
    if (i === 2) return { opacity: clamp(landP * 2), scale: 0.5 + 0.5 * ease.outBack(landP, 2.4), dx: 0 };
    const start = i === 1 || i === 3 ? T.spread[0] : T.spread[1];
    const p = clamp((t - start) / T.spreadDur);
    const e = ease.outBack(p, 1.6);
    const fromMiddle = GROUP.slotX(2) - GROUP.slotX(i);
    return { opacity: clamp(p * 2.5), scale: 0.55 + 0.45 * e, dx: fromMiddle * (1 - ease.outCubic(p)) };
  });

  // a new star pops back into the bag
  const pb = prog(t, T.popBack);
  const popper = { visible: t >= T.popBack[0] && t < T.popBack[1], opacity: clamp(pb * 4), scale: ease.outBack(pb, 2.6) };

  return {
    logo: { opacity: li, scale: 0.94 + 0.06 * li, full: !emptyBag },
    flyer: { visible: flyerVisible, opacity: fo, dy: fy, scale: fs, rotate: fr },
    popper,
    stars,
    handoff: ease.inOutCubic(prog(t, T.handoff)),
    overlay: 1 - prog(t, T.fade),
    done: t >= T.end,
  };
}
