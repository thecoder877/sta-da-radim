import type { GeneratedTrip, SavedTripSummary } from "@/types/trip";

export async function saveTripToAccount(trip: GeneratedTrip): Promise<GeneratedTrip> {
  const response = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  const data = (await response.json()) as { trip?: GeneratedTrip; error?: string };
  if (!response.ok || !data.trip) {
    throw new Error(data.error ?? "TRIP_SAVE_FAILED");
  }
  return data.trip;
}

export async function fetchSavedTrips(): Promise<SavedTripSummary[]> {
  const response = await fetch("/api/trips");
  const data = (await response.json()) as { trips?: SavedTripSummary[]; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "TRIP_LIST_FAILED");
  }
  return data.trips ?? [];
}

export async function fetchPersistedTrip(id: string): Promise<GeneratedTrip | null> {
  const response = await fetch(`/api/trips/${id}`);
  if (response.status === 404) {
    return null;
  }
  const data = (await response.json()) as { trip?: GeneratedTrip };
  return data.trip ?? null;
}

export async function fetchSharedTrip(slug: string): Promise<GeneratedTrip | null> {
  const response = await fetch(`/api/trips/share/${slug}`);
  if (response.status === 404) {
    return null;
  }
  const data = (await response.json()) as { trip?: GeneratedTrip };
  return data.trip ?? null;
}

export async function updateTripSharing(id: string, isPublic: boolean): Promise<GeneratedTrip> {
  const response = await fetch(`/api/trips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic }),
  });
  const data = (await response.json()) as { trip?: GeneratedTrip; error?: string };
  if (!response.ok || !data.trip) {
    throw new Error(data.error ?? "TRIP_UPDATE_FAILED");
  }
  return data.trip;
}

export async function deleteTripFromAccount(id: string): Promise<void> {
  const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "TRIP_DELETE_FAILED");
  }
}
