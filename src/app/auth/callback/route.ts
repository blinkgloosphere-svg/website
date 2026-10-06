import { NextResponse } from "next/server";

/**
 * Old address used by login emails sent before /auth/confirm existed.
 * Forwards everything (query, and the #fragment, which browsers keep across
 * redirects) to /auth/confirm, which verifies the link in the browser.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/auth/confirm", url.origin);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return NextResponse.redirect(target);
}
