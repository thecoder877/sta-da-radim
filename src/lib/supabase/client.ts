import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/security/cookies";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv();
  if (!env) {
    return null;
  }
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey, {
      cookieOptions: supabaseCookieOptions(),
    });
  }
  return browserClient;
}
