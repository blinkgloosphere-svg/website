import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/data";

export async function POST(req: Request) {
  if (hasSupabase()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", new URL(req.url).origin), { status: 303 });
}
