/**
 * Stand-in for @supabase/ssr while the real package is not installed.
 * next.config.ts aliases the package here only when it is missing, so the app
 * runs in preview mode without it. Install the package to replace this.
 */
const MESSAGE = "Supabase is not installed. Run: npm install @supabase/supabase-js @supabase/ssr";

export function createServerClient(): never {
  throw new Error(MESSAGE);
}

export function createBrowserClient(): never {
  throw new Error(MESSAGE);
}
