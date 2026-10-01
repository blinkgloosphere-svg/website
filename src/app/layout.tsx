import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Blink Reviews",
    template: "%s · Blink Reviews",
  },
  description: "Customer reviews, local SEO and search visibility for Singapore businesses. Get seen. Build trust. Grow.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://reviews.blink.sg"),
  icons: { icon: "/brand/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
