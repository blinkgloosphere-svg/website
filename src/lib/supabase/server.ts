import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "./env";

export type TypedClient = SupabaseClient<Database>;

/**
 * Cookie-backed client for Server Components, Server Actions and Route
 * Handlers. Acts as the signed-in user, so row level security applies.
 */
export async function createClient(): Promise<TypedClient> {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. Session refresh is handled
          // by the proxy/middleware, so ignoring this is safe.
        }
      },
    },
  });
}

let serviceClient: TypedClient | null = null;

/**
 * Service-role client. Bypasses row level security and never touches cookies,
 * so it must only be used in trusted server code after authorisation checks.
 */
export function createServiceClient(): TypedClient {
  if (!serviceClient) {
    serviceClient = createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return serviceClient;
}
