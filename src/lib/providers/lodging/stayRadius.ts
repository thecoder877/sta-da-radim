import { calculateDistanceKm } from "@/lib/geo/distance";
import type { Coordinates, Place } from "@/types/place";

export const MAX_LODGING_DISTANCE_KM = 20;

export function isLodgingWithinStayRadius(
  origin: Coordinates,
  place: Pick<Place, "latitude" | "longitude">,
): boolean {
  return (
    calculateDistanceKm(origin, {
      latitude: place.latitude,
      longitude: place.longitude,
    }) <= MAX_LODGING_DISTANCE_KM
  );
}
