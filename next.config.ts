import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
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
