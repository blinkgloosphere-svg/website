import { NextResponse } from "next/server";
import { VIEW_AS_COOKIE, viewAsBusinessId } from "@/lib/auth";

/** Leaves "view as client" and returns to that business in the admin. */
export async function GET(req: Request) {
  const id = await viewAsBusinessId();
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL(id ? `/admin/businesses/${id}` : "/admin", origin));
  res.cookies.delete(VIEW_AS_COOKIE);
  return res;
}
