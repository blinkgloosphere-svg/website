/**
 * Supabase environment variables. Each accessor throws a message that says
 * exactly which variable is missing and where to find it.
 */

function read(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. ${hint} Add it to .env.local (see supabase/README.md).`);
  }
  return value;
}

export const supabaseUrl = () =>
  read("NEXT_PUBLIC_SUPABASE_URL", "This is the Project URL under Project Settings > API.");

export const supabaseAnonKey = () =>
  read("NEXT_PUBLIC_SUPABASE_ANON_KEY", "This is the anon/public key under Project Settings > API.");

/** Server-only. Bypasses row level security; never expose to the browser. */
export const supabaseServiceRoleKey = () =>
  read("SUPABASE_SERVICE_ROLE_KEY", "This is the service_role key under Project Settings > API.");

/** Optional; used to build redirect links in auth emails. */
export const siteUrl = (): string | null => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? null;

export const hasSupabaseEnv = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
