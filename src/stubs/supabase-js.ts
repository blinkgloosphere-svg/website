/** Stand-in for @supabase/supabase-js while the real package is not installed. See supabase-ssr.ts. */
const MESSAGE = "Supabase is not installed. Run: npm install @supabase/supabase-js @supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClient<T = unknown> = any & { __db?: T };

export function createClient(): never {
  throw new Error(MESSAGE);
}
