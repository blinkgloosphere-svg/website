import type { Repo } from "./repo";
import { previewRepo } from "./preview-repo";

export const hasSupabase = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Returns the active data repository. With Supabase keys in the environment
 * the live database is used; otherwise the read-only preview built from the
 * exported data.
 */
export async function getRepo(): Promise<Repo> {
  if (hasSupabase()) {
    const { supabaseRepo } = await import("./supabase-repo");
    return supabaseRepo();
  }
  return previewRepo();
}

export type { Repo } from "./repo";
export { ReadOnlyError } from "./repo";
