import { AUTH_FETCH_TIMEOUT_MS, authFetchSignal } from "@/lib/http/authFetch";
import type { PlanQuota } from "@/lib/access/planQuota";
import type { UserProfile } from "@/types/user";

export type AuthMeResponse = {
  user?: { id: string } | null;
  profile?: UserProfile | null;
  quota?: PlanQuota | null;
};

export { AUTH_FETCH_TIMEOUT_MS };

export async function fetchAuthMe(): Promise<AuthMeResponse | null> {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin",
    signal: authFetchSignal(),
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as AuthMeResponse;
}
