import { USERNAME_PATTERN } from "@/lib/community/constants";
import type { PublicAuthor } from "@/types/community";
import type { UserProfile } from "@/types/user";

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function profileLabel(
  profile: Pick<UserProfile, "displayName" | "username"> | null | undefined,
): string {
  return profile?.displayName?.trim() || profile?.username || "Korisnik";
}

export function authorFromProfile(profile: {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}): PublicAuthor {
  return {
    id: profile.id,
    username: profile.username ?? null,
    displayName: profile.display_name ?? null,
    avatarUrl: profile.avatar_url ?? null,
  };
}

export function handleFromProfile(
  profile: Pick<UserProfile, "username"> | null | undefined,
): string | null {
  return profile?.username ? `@${profile.username}` : null;
}
