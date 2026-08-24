import { calculateDistanceKm } from "@/lib/geo/distance";
import { BUDGET_HEADROOM_FACTOR } from "@/lib/tripPlanner/config";
import type { Coordinates, Place } from "@/types/place";

export function filterPlacesByDistance(
  places: Place[],
  origin: Coordinates,
  maxDistanceKm?: number,
): Place[] {
  if (!maxDistanceKm) {
    return places;
  }

  return places.filter((place) => {
    const distance = calculateDistanceKm(origin, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    return distance <= maxDistanceKm;
  });
}

export function filterPlacesByBudget(
  places: Place[],
  budget?: number,
  numberOfPeople = 1,
): Place[] {
  if (!budget) {
    return places;
  }

  const perPersonBudget = budget / Math.max(numberOfPeople, 1);

  return places.filter((place) => {
    const cost = place.estimatedCostPerPerson ?? 0;
    return cost <= perPersonBudget * BUDGET_HEADROOM_FACTOR;
  });
}

export function filterPlacesByInterests(
  places: Place[],
  interests: string[],
): Place[] {
  if (interests.length === 0) {
    return places;
  }

  const interestSet = new Set(interests.map((item) => item.toLowerCase()));

  return places.filter((place) => {
    const haystack = [
      place.category.toLowerCase(),
      ...place.tags.map((tag) => tag.toLowerCase()),
    ];
    return haystack.some((value) => interestSet.has(value));
  });
}
