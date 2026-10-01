"use client";

import { forwardRef, useMemo } from "react";
import QRCode from "qrcode";

export type PosterTheme = "light" | "dark" | "brand";

type Props = {
  businessName: string;
  url: string;
  theme?: PosterTheme;
  /** Rendered width in px. The SVG scales; downloads use the viewBox. */
  width?: number;
  caption?: string;
};

const THEMES: Record<PosterTheme, { bg: string; fg: string; sub: string; qrBg: string; qrFg: string; accent: string }> = {
  light: { bg: "#ffffff", fg: "#08090a", sub: "#62666d", qrBg: "#ffffff", qrFg: "#08090a", accent: "#F5B400" },
  dark: { bg: "#0f1012", fg: "#ffffff", sub: "#9ea2a8", qrBg: "#ffffff", qrFg: "#08090a", accent: "#F5B400" },
  brand: { bg: "#F5B400", fg: "#0b0b0c", sub: "#5a4400", qrBg: "#ffffff", qrFg: "#0b0b0c", accent: "#0b0b0c" },
};

/** Print-ready review poster (A6 ratio) with the QR code drawn as SVG paths. */
export const QrPoster = forwardRef<SVGSVGElement, Props>(function QrPoster(
  { businessName, url, theme = "light", width = 360, caption = "Scan to leave us a review" },
  ref,
) {
  const t = THEMES[theme];
  const W = 600;
  const H = 850;

  const modules = useMemo(() => {
    const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const data = qr.modules.data as Uint8Array;
    const cells: string[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[y * size + x]) cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { size, path: cells.join("") };
  }, [url]);

  const qrBox = 380;
  const qrX = (W - qrBox) / 2;
  const qrY = 230;
  const scale = (qrBox - 40) / modules.size;

  const name = businessName.length > 34 ? `${businessName.slice(0, 32)}…` : businessName;
  const nameSize = name.length > 24 ? 30 : 36;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      width={width}
      height={(width * H) / W}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Review QR poster for ${businessName}`}
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}
    >
      <rect width={W} height={H} rx="36" fill={t.bg} />
      <text x={W / 2} y={96} textAnchor="middle" fontSize="22" fontWeight="600" letterSpacing="4" fill={t.sub}>
        REVIEW US ON
      </text>
      <text x={W / 2} y={160} textAnchor="middle" fontSize="56" fontWeight="700" letterSpacing="-2" fill={t.fg}>
        Google
      </text>
      <g transform={`translate(${W / 2 - 110} 182)`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            transform={`translate(${i * 46} 0) scale(1.6)`}
            fill={t.accent}
            d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z"
          />
        ))}
      </g>
      <rect x={qrX} y={qrY} width={qrBox} height={qrBox} rx="24" fill={t.qrBg} stroke={theme === "light" ? "#e6e7e8" : "none"} />
      <g transform={`translate(${qrX + 20} ${qrY + 20}) scale(${scale})`} fill={t.qrFg} shapeRendering="crispEdges">
        <path d={modules.path} />
      </g>
      <text x={W / 2} y={qrY + qrBox + 72} textAnchor="middle" fontSize={nameSize} fontWeight="600" letterSpacing="-1" fill={t.fg}>
        {name}
      </text>
      <text x={W / 2} y={qrY + qrBox + 112} textAnchor="middle" fontSize="20" fill={t.sub}>
        {caption}
      </text>
      <g transform={`translate(${W / 2 - 60} ${H - 70})`}>
        <path
          transform="scale(0.9)"
          fill={t.accent}
          stroke={t.fg}
          strokeWidth="1.5"
          d="M14 2c-1.5 3-5 4.5-9 4.5 1.5 4 4.5 6.5 9 7.5 4.5-1 7.5-3.5 9-7.5-4 0-7.5-1.5-9-4.5z"
        />
        <text x="34" y="14" fontSize="16" fontWeight="600" fill={t.fg}>
          Powered by Blink
        </text>
      </g>
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
