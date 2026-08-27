import type { SupabaseClient, User } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/async/withTimeout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GET_USER_TIMEOUT_MS = 10_000;

export async function getUserFromClient(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      GET_USER_TIMEOUT_MS,
      "supabase.auth.getUser timed out",
    );
    if (error) {
      return null;
    }
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }
  return getUserFromClient(supabase);
}

export function isAuthRequiredFor(action: "save" | "review" | "submit") {
  return action === "save" || action === "review" || action === "submit";
}
