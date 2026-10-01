"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";
import { encodeQr } from "@/lib/qr";

export type PosterTheme = "light" | "dark" | "brand";

type Props = {
  businessName: string;
  url: string;
  theme?: PosterTheme;
  /** Rendered width in px. The SVG scales; downloads use the viewBox. */
  width?: number;
  caption?: string;
};

const THEMES: Record<PosterTheme, { bg: string; fg: string; sub: string; qrBg: string; qrFg: string; star: string; pill: string; pillFg: string }> = {
  light: { bg: "#ffffff", fg: "#08090a", sub: "#08090a", qrBg: "#ffffff", qrFg: "#08090a", star: "#F5B400", pill: "#FFC21A", pillFg: "#0b0b0c" },
  dark: { bg: "#0f1012", fg: "#ffffff", sub: "#ffffff", qrBg: "#ffffff", qrFg: "#08090a", star: "#F5B400", pill: "#FFC21A", pillFg: "#0b0b0c" },
  brand: { bg: "#FFC21A", fg: "#0b0b0c", sub: "#0b0b0c", qrBg: "#ffffff", qrFg: "#0b0b0c", star: "#0b0b0c", pill: "#0b0b0c", pillFg: "#ffffff" },
};

const ICON_SRC = "/brand/blink-mark-160.png";
let iconCache: string | null = null;

/**
 * The Blink icon as a data URL. An SVG that is rasterised to PNG can only
 * include images that are embedded, so the icon is inlined once and reused.
 */
function useBlinkIcon() {
  const [data, setData] = useState<string | null>(iconCache);
  useEffect(() => {
    if (iconCache) return;
    let alive = true;
    fetch(ICON_SRC)
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise<string>((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.readAsDataURL(b);
          }),
      )
      .then((url) => {
        iconCache = url;
        if (alive) setData(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** Print-ready review poster (A6 ratio) with the QR code drawn as SVG paths. */
export const QrPoster = forwardRef<SVGSVGElement, Props>(function QrPoster(
  { businessName, url, theme = "light", width = 360, caption = "Scan to leave a review on Google" },
  ref,
) {
  const t = THEMES[theme];
  const icon = useBlinkIcon();
  const W = 600;
  const H = 880;

  const modules = useMemo(() => {
    const qr = encodeQr(url);
    const cells: string[] = [];
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { size: qr.size, path: cells.join("") };
  }, [url]);

  const qrBox = 380;
  const qrX = (W - qrBox) / 2;
  const qrY = 230;
  const quiet = 22;
  const scale = (qrBox - quiet * 2) / modules.size;

  const name = businessName.length > 34 ? `${businessName.slice(0, 32)}…` : businessName;
  const nameSize = name.length > 24 ? 30 : 36;

  // "Powered by Blink" pill, centred.
  const pillW = 296;
  const pillH = 60;
  const pillX = (W - pillW) / 2;
  const pillY = H - 104;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      width={width}
      height={(width * H) / W}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-label={`Review QR poster for ${businessName}`}
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", width: "100%", maxWidth: width, height: "auto" }}
    >
      <rect width={W} height={H} rx="36" fill={t.bg} />

      <text x={W / 2} y={96} textAnchor="middle" fontSize="22" fontWeight="600" letterSpacing="4" fill={t.fg} opacity="0.6">
        REVIEW US ON
      </text>
      <text x={W / 2} y={160} textAnchor="middle" fontSize="56" fontWeight="700" letterSpacing="-2" fill={t.fg}>
        Google
      </text>
      <g transform={`translate(${W / 2 - 110} 180)`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} transform={`translate(${i * 46} 0) scale(1.6)`} fill={t.star} d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" />
        ))}
      </g>

      <rect x={qrX} y={qrY} width={qrBox} height={qrBox} rx="24" fill={t.qrBg} stroke={theme === "light" ? "#e6e7e8" : "none"} />
      <g transform={`translate(${qrX + quiet} ${qrY + quiet}) scale(${scale})`} fill={t.qrFg} shapeRendering="crispEdges">
        <path d={modules.path} />
      </g>

      <text x={W / 2} y={qrY + qrBox + 70} textAnchor="middle" fontSize={nameSize} fontWeight="700" letterSpacing="-1" fill={t.fg}>
        {name}
      </text>
      <text x={W / 2} y={qrY + qrBox + 116} textAnchor="middle" fontSize="25" fontWeight="500" letterSpacing="-0.3" fill={t.sub}>
        {caption}
      </text>

      <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={pillH / 2} fill={t.pill} />
      {icon ? (
        <image href={icon} xlinkHref={icon} x={pillX + 16} y={pillY + 9} width="42" height="42" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <circle cx={pillX + 36} cy={pillY + pillH / 2} r="16" fill={t.pillFg} opacity="0.15" />
      )}
      <text x={pillX + 70} y={pillY + 38.5} fontSize="23" fontWeight="600" letterSpacing="-0.3" fill={t.pillFg}>
        Powered by Blink
      </text>
    </svg>
  );
});

/** Rasterises an SVG element to a PNG blob at the given pixel width. */
export async function svgToPng(svg: SVGSVGElement, pixelWidth = 1800): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not render poster"));
      i.src = svgUrl;
    });
    const vb = svg.viewBox.baseVal;
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = Math.round((pixelWidth * vb.height) / vb.width);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
