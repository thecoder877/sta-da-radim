import type { TransportType } from "@/types/trip";
import { estimateTravelMinutes } from "./distance.ts";

/** Speeds above this are almost certainly a car route applied to walk/bike. */
const MAX_REALISTIC_KMH: Record<TransportType, number> = {
  walk: 6.5,
  bike: 28,
  car: 130,
  bus: 110,
  train: 160,
};

export function impliedSpeedKmh(distanceKm: number, durationMinutes: number): number {
  if (durationMinutes <= 0 || distanceKm <= 0) {
    return 0;
  }
  return (distanceKm / durationMinutes) * 60;
}

/**
 * Public OSRM car servers often return driving duration even when the trip is walking.
 * If the implied speed is impossible for the chosen transport, fall back to our pace model.
 */
export function sanitizeTravelMinutes(
  distanceKm: number,
  durationMinutes: number | undefined,
  transport: TransportType,
): number {
  const estimated = estimateTravelMinutes(distanceKm, transport);
  if (durationMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return estimated;
  }

  const kmh = impliedSpeedKmh(distanceKm, durationMinutes);
  if (kmh > MAX_REALISTIC_KMH[transport]) {
    return estimated;
  }

  return Math.round(durationMinutes);
}

/** Sensible default radius when the traveler picked walk/bike and left distance as “doesn’t matter”. */
export function defaultMaxDistanceKm(
  transport: TransportType,
  requested?: number,
): number | undefined {
  if (requested != null && Number.isFinite(requested) && requested > 0) {
    return requested;
  }
  if (transport === "walk") {
    return 20;
  }
  if (transport === "bike") {
    return 50;
  }
  return undefined;
}

/** How far a person can realistically cover in one day with this transport. */
export function dailyTravelBudgetKm(transport: TransportType): number | undefined {
  if (transport === "walk") {
    return 18;
  }
  if (transport === "bike") {
    return 55;
  }
  return undefined;
}

/**
 * Search radius around the start. For walk/bike this cannot exceed
 * what is reachable in the chosen number of days.
 */
export function effectiveSearchRadiusKm(
  transport: TransportType,
  requested: number | undefined,
  days: number,
): number | undefined {
  const radius = defaultMaxDistanceKm(transport, requested);
  const daily = dailyTravelBudgetKm(transport);
  if (daily == null) {
    return radius;
  }

  const reachable = daily * Math.max(days, 1);
  if (radius == null) {
    return reachable;
  }
  return Math.min(radius, reachable);
}
