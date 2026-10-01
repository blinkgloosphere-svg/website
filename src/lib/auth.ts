import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepo, hasSupabase } from "@/lib/data";
import type { Business } from "@/lib/types";

/**
 * PREVIEW MODE
 * ------------
 * When Supabase is not configured (no NEXT_PUBLIC_SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY) the app runs on the read-only export. There is no
 * login in that mode, so these helpers hand back a fake "preview" principal:
 *
 *   - requireAdmin()         -> { preview: true }
 *   - requireOwnerBusiness() -> the first business in the export
 *
 * That lets the admin and dashboard screens be opened and inspected. Every
 * write still fails with ReadOnlyError from the preview repo, so nothing can be
 * changed. Check `isPreview()` in the UI to show a banner and hide actions.
 */
export const isPreview = (): boolean => !hasSupabase();

export type SessionUser = { id: string; email: string | null };
export type AdminPrincipal = { preview: true } | { preview: false; user: SessionUser };

const LOGIN_PATH = "/login";

/** The signed-in user from the request cookies, or null. Always null in preview. */
export async function getSession(): Promise<SessionUser | null> {
  if (isPreview()) return null;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

async function isAdminUser(userId: string): Promise<boolean> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const { count, error } = await createServiceClient()
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(`admin check failed: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * Guards admin pages. Redirects to the login page when signed out, and to the
 * owner dashboard when signed in but not an admin.
 */
export async function requireAdmin(): Promise<AdminPrincipal> {
  if (isPreview()) return { preview: true };
  const user = await getSession();
  if (!user) redirect(`${LOGIN_PATH}?next=/admin`);
  if (!(await isAdminUser(user.id))) redirect("/dashboard");
  return { preview: false, user };
}

/**
 * Guards owner dashboard pages. Redirects to login when signed out. Returns
 * null when the signed-in user has no business linked yet (owner_id unset).
 */
/** Cookie set by an admin to open a client's dashboard as that client. */
export const VIEW_AS_COOKIE = "blink_view_as";

/** The business an admin is currently viewing as, if any. Only honoured for admins (or in preview). */
export async function viewAsBusinessId(): Promise<string | null> {
  return (await cookies()).get(VIEW_AS_COOKIE)?.value ?? null;
}

export async function requireOwnerBusiness(): Promise<Business | null> {
  const viewAs = await viewAsBusinessId();
  const repo = await getRepo();
  if (isPreview()) {
    if (viewAs) {
      const b = await repo.getBusiness(viewAs);
      if (b) return b;
    }
    const [first] = await repo.listBusinesses({ sort: "name" });
    return first ?? null;
  }
  const user = await getSession();
  if (!user) redirect(`${LOGIN_PATH}?next=/dashboard`);
  if (viewAs && (await isAdminUser(user.id))) {
    const b = await repo.getBusiness(viewAs);
    if (b) return b;
  }
  const { getBusinessByOwnerId } = await import("@/lib/data/supabase-repo");
  return getBusinessByOwnerId(user.id);
}
