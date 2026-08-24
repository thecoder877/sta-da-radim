import { TRAVEL_SPEED_KMH } from "@/lib/tripPlanner/config";
import type { Coordinates } from "@/types/place";
import type { TransportType } from "@/types/trip";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Geographic (great-circle) distance in kilometers.
 * This is not driving distance. Later routing APIs should replace it
 * when a real travel path is needed.
 */
export function calculateDistanceKm(
  pointA: Coordinates,
  pointB: Coordinates,
): number {
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);
  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function estimateTravelMinutes(
  distanceKm: number,
  transport: TransportType,
): number {
  const kmPerHour = TRAVEL_SPEED_KMH[transport];
  return Math.round((distanceKm / kmPerHour) * 60);
}

export function toCoordinates(
  latitude: number,
  longitude: number,
): Coordinates {
  return { latitude, longitude };
}
