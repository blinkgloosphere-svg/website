import { NextResponse } from "next/server";
import { requireAdmin, VIEW_AS_COOKIE } from "@/lib/auth";
import { getRepo } from "@/lib/data";

/** Opens the client dashboard as this business. Admins only. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const origin = new URL(req.url).origin;
  if (!(await (await getRepo()).getBusiness(id))) return NextResponse.redirect(new URL("/admin/businesses", origin));
  const res = NextResponse.redirect(new URL("/dashboard", origin));
  res.cookies.set(VIEW_AS_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
  return res;
}
