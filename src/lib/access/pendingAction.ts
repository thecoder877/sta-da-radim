import type { TripRequest, GeneratedTrip } from "@/types/trip";

const PENDING_ACTION_KEY = "stadardim_pending_action";

export type AuthModalReason = "generation_limit" | "save_trip" | "protected_action";

export type PendingProtectedAction =
  { type: "generate"; request: TripRequest } | { type: "save_trip"; trip: GeneratedTrip };

export function setPendingProtectedAction(action: PendingProtectedAction): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
}

export function readPendingProtectedAction(): PendingProtectedAction | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(PENDING_ACTION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PendingProtectedAction;
  } catch {
    return null;
  }
}

export function clearPendingProtectedAction(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PENDING_ACTION_KEY);
}
