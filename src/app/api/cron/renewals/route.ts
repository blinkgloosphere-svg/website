import { NextResponse } from "next/server";
import { getRepo, hasSupabase } from "@/lib/data";
import { sendRenewalEmail, sgDayWindow } from "@/lib/renewals";

/**
 * Daily at 09:00 Singapore time (see vercel.json). Emails every active client
 * whose subscription ends exactly one week from today. Vercel calls this with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = !hasSupabase() || new URL(req.url).searchParams.has("dry");
  const { start, end } = sgDayWindow(7);
  const due = (await (await getRepo()).listBusinesses({ activeOnly: true })).filter((b) => {
    const t = b.linkExpiresAt ? new Date(b.linkExpiresAt).getTime() : NaN;
    return t >= start && t < end;
  });
  let sent = 0;
  if (!dryRun) for (const b of due) if (await sendRenewalEmail(b, "reminder")) sent++;
  return NextResponse.json({ dryRun, windowStart: new Date(start).toISOString(), due: due.map((b) => b.name), sent });
}
