import { calculateDistanceKm } from "@/lib/geo/distance";
import type { Coordinates, Place } from "@/types/place";
import type { TripRequest } from "@/types/trip";

export interface ScoredPlace {
  place: Place;
  score: number;
  distanceKm: number;
}

export function calculatePlaceScore(
  place: Place,
  request: TripRequest,
  origin: Coordinates,
): number {
  let score = 0;
  const interests = new Set(request.interests.map((item) => item.toLowerCase()));
  const tags = place.tags.map((tag) => tag.toLowerCase());
  const category = place.category.toLowerCase();

  for (const tag of tags) {
    if (interests.has(tag)) {
      score += 10;
    }
  }

  if (interests.has(category)) {
    score += 10;
  }

  const distanceKm = calculateDistanceKm(origin, {
    latitude: place.latitude,
    longitude: place.longitude,
  });

  if (distanceKm <= 25) {
    score += 8;
  } else if (distanceKm <= 50) {
    score += 5;
  } else if (distanceKm <= 100) {
    score += 2;
  }

  if (place.verified) {
    score += 3;
  }

  if (place.estimatedDurationMinutes) {
    const minutes = place.estimatedDurationMinutes;
    if (minutes >= 40 && minutes <= 180) {
      score += 2;
    }
  }

  if (request.budget && place.estimatedCostPerPerson !== undefined) {
    const perPersonBudget = request.budget / Math.max(request.numberOfPeople, 1);
    if (place.estimatedCostPerPerson <= perPersonBudget * 0.5) {
      score += 5;
    }
  } else if (!request.budget) {
    score += 1;
  }

  if (place.hiddenGem && interests.has("skrivena-mesta")) {
    score += 4;
  }

  if (place.romantic && interests.has("romanticno")) {
    score += 3;
  }

  if (place.suitableForChildren && interests.has("porodicno")) {
    score += 3;
  }

  return score;
}

export function rankPlacesForTrip(
  places: Place[],
  request: TripRequest,
  origin: Coordinates,
): ScoredPlace[] {
  return places
    .map((place) => ({
      place,
      score: calculatePlaceScore(place, request, origin),
      distanceKm: calculateDistanceKm(origin, {
        latitude: place.latitude,
        longitude: place.longitude,
      }),
    }))
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
}
