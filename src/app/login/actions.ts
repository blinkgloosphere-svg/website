"use server";

import { headers } from "next/headers";
import { z } from "zod";

/** At most one reset email per address per minute, and a few per visitor per 10 minutes. */
const byEmail = new Map<string, number>();
const byIp = new Map<string, number[]>();

function limited(email: string, ip: string) {
  const now = Date.now();
  if (now - (byEmail.get(email) ?? 0) < 60_000) return true;
  const recent = (byIp.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) return true;
  byEmail.set(email, now);
  byIp.set(ip, [...recent, now]);
  return false;
}

/**
 * "Forgot password?" on the login page. Always answers the same way, so it
 * never reveals whether an email has a login.
 */
export async function requestPasswordResetAction(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(parsed.data, ip)) return { ok: false, error: "We just sent a link. Please wait a minute before asking for another." };
  try {
    const { sendAccessLink } = await import("@/lib/auth-links");
    await sendAccessLink(parsed.data, "reset");
  } catch (e) {
    console.error("[password reset]", e);
    return { ok: false, error: "We couldn't send the email right now. Please try again in a few minutes." };
  }
  return { ok: true };
}
