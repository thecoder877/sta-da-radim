import type { GeneratedTrip, TripRequest } from "@/types/trip";

const STORAGE_PREFIX = "sta-da-radim:trip:";
const LAST_REQUEST_KEY = "stadardim_last_trip_request";
const LAST_TRIP_ID_KEY = "stadardim_last_trip_id";

export function persistGeneratedTrip(trip: GeneratedTrip): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${trip.id}`, JSON.stringify(trip));
  window.sessionStorage.setItem(LAST_TRIP_ID_KEY, trip.id);
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

export function persistLastTripRequest(request: TripRequest): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(LAST_REQUEST_KEY, JSON.stringify(request));
}

export function readLastTripRequest(): TripRequest | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(LAST_REQUEST_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as TripRequest;
  } catch {
    return null;
  }
}
