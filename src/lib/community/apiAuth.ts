import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfileById, isAdminUser } from "@/lib/auth/profile";
import { CommunityError } from "@/lib/community/errors";
import { publicError } from "@/lib/community/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export async function requireAuthed(): Promise<{
  user: User;
  profile: UserProfile | null;
  supabase: SupabaseClient;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new CommunityError("Supabase nije podešen.", "SUPABASE_MISSING", 503);
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new CommunityError("Prijava je potrebna.", "AUTH_REQUIRED", 401);
  }
  const profile = await getProfileById(supabase, user.id);
  return { user, profile, supabase };
}

export async function requireAdmin(): Promise<{
  user: User;
  profile: UserProfile;
  supabase: SupabaseClient;
}> {
  const ctx = await requireAuthed();
  if (!(await isAdminUser(ctx.supabase, ctx.user.id)) || !ctx.profile) {
    throw new CommunityError("Nemate pristup.", "FORBIDDEN", 403);
  }
  return { ...ctx, profile: ctx.profile };
}

export function communityResponse(error: unknown) {
  if (error instanceof CommunityError) {
    const mapped = publicError(error.code);
    return NextResponse.json({ error: mapped.error, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Akcija nije uspela.", code: "UNKNOWN" }, { status: 400 });
}
