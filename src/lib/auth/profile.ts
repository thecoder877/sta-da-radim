import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidUsername, normalizeUsername } from "@/lib/community/identity";
import { CommunityError } from "@/lib/community/errors";
import type { UserProfile } from "@/types/user";

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "user" | "admin" | null;
  created_at: string;
  updated_at: string;
}

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role === "admin" ? "admin" : "user",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapProfile(data as ProfileRow);
}

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapProfile(data as ProfileRow);
}

export async function requireUsername(profile: UserProfile | null): Promise<UserProfile> {
  if (!profile?.username) {
    throw new CommunityError("Odaberi korisničko ime.", "USERNAME_REQUIRED");
  }
  return profile;
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  input: { username?: string; displayName?: string; bio?: string; avatarUrl?: string | null },
): Promise<UserProfile> {
  const patch: Record<string, unknown> = {};
  if (input.username !== undefined) {
    const username = normalizeUsername(input.username);
    if (!isValidUsername(username)) {
      throw new CommunityError("Neispravno korisničko ime.", "INVALID_REQUEST");
    }
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .maybeSingle();
    if (taken) {
      throw new CommunityError("To korisničko ime je zauzeto.", "USERNAME_TAKEN");
    }
    patch.username = username;
  }
  if (input.displayName !== undefined) {
    patch.display_name = input.displayName.trim() || null;
  }
  if (input.bio !== undefined) {
    patch.bio = input.bio.trim() || null;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      throw new CommunityError("To korisničko ime je zauzeto.", "USERNAME_TAKEN");
    }
    throw new CommunityError("Profil nije sačuvan.", "INVALID_REQUEST");
  }
  return mapProfile(data as ProfileRow);
}

export async function isAdminUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const profile = await getProfileById(supabase, userId);
  return profile?.role === "admin";
}
