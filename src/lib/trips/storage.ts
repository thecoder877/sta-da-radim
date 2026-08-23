import type { GeneratedTrip } from "@/types/trip";

const STORAGE_PREFIX = "sta-da-radim:trip:";

export function persistGeneratedTrip(trip: GeneratedTrip): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${trip.id}`, JSON.stringify(trip));
}

export function readGeneratedTrip(id: string): GeneratedTrip | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GeneratedTrip;
  } catch {
    return null;
  }
}
