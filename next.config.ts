import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

/**
 * Optional packages. While one is not installed its import is pointed at a
 * local stand-in so the app still runs (in preview mode). Installing the
 * package removes the alias automatically.
 */
const OPTIONAL: Record<string, string> = {
  "@supabase/ssr": "./src/stubs/supabase-ssr.ts",
  "@supabase/supabase-js": "./src/stubs/supabase-js.ts",
  resend: "./src/stubs/resend.ts",
};
const missing = Object.entries(OPTIONAL).filter(([pkg]) => !fs.existsSync(path.join(process.cwd(), "node_modules", pkg)));
const resolveAlias = Object.fromEntries(missing.map(([pkg, stub]) => [pkg, stub]));
if (missing.length) console.info(`[blink] running without: ${missing.map(([p]) => p).join(", ")} (preview mode stand-ins in use)`);

const nextConfig: NextConfig = {
  turbopack: { resolveAlias },
  // Type errors from the missing packages must not block a preview build.
  typescript: { ignoreBuildErrors: missing.length > 0 },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gloosphere.com" },
      { protocol: "https", hostname: "*.sg-host.com" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  async rewrites() {
    // Printed QR codes point at the old addresses. Keep them working forever.
    return [
      { source: "/reviewsoftware.html", has: [{ type: "query", key: "id", value: "(?<id>.*)" }], destination: "/r/:id" },
      { source: "/reviewsoftware", has: [{ type: "query", key: "id", value: "(?<id>.*)" }], destination: "/r/:id" },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard.html", destination: "/dashboard", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
