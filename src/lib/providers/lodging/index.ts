import { MOCK_LODGING } from "@/data/mockLodging";
import { calculateDistanceKm } from "@/lib/geo/distance";
import { searchGoogleLodging } from "@/lib/providers/lodging/googleLodging";
import { searchOverpassLodging } from "@/lib/providers/places/overpass";
import { rememberPlaces } from "@/lib/places/placeMemory";
import type { Coordinates, Place } from "@/types/place";

function sortByDistance(origin: Coordinates, places: Place[]): Place[] {
  return [...places].sort(
    (a, b) =>
      calculateDistanceKm(origin, { latitude: a.latitude, longitude: a.longitude }) -
      calculateDistanceKm(origin, { latitude: b.latitude, longitude: b.longitude }),
  );
}

export function pickFallbackLodging(
  origin: Coordinates,
  usedIds: Set<string>,
): Place | null {
  return (
    sortByDistance(origin, MOCK_LODGING).find((place) => !usedIds.has(place.id)) ?? null
  );
}

export async function findLodgingNearby(
  origin: Coordinates,
  usedIds: Set<string>,
): Promise<Place | null> {
  const collected: Place[] = [];

  try {
    const google = await searchGoogleLodging(origin.latitude, origin.longitude, 14000);
    collected.push(...google);
  } catch {
    // Google Places is optional
  }

  if (collected.length < 3) {
    try {
      const osm = await searchOverpassLodging(origin.latitude, origin.longitude, 16000);
      collected.push(...osm);
    } catch {
      // OpenStreetMap hotel search is best-effort
    }
  }

  if (collected.length === 0) {
    collected.push(...MOCK_LODGING);
  }

  const unique = new Map<string, Place>();
  for (const place of collected) {
    if (!unique.has(place.id)) {
      unique.set(place.id, place);
    }
  }

  const ranked = sortByDistance(origin, [...unique.values()]).filter(
    (place) =>
      !usedIds.has(place.id) &&
      calculateDistanceKm(origin, {
        latitude: place.latitude,
        longitude: place.longitude,
      }) <= 40,
  );

  const fallback = sortByDistance(origin, MOCK_LODGING).find(
    (place) => !usedIds.has(place.id),
  );
  const chosen = ranked[0] ?? fallback ?? null;
  if (chosen) {
    rememberPlaces([chosen]);
  }
  return chosen;
}
