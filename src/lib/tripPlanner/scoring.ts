import { calculateDistanceKm } from "@/lib/geo/distance";
import {
  BUDGET_FRIENDLY_FACTOR,
  DISTANCE_SCORE_BANDS,
  DURATION_SCORE_BAND,
  SCORE_WEIGHTS,
} from "@/lib/tripPlanner/config";
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
      score += SCORE_WEIGHTS.interestTagMatch;
    }
  }

  if (interests.has(category)) {
    score += SCORE_WEIGHTS.interestCategoryMatch;
  }

  const distanceKm = calculateDistanceKm(origin, {
    latitude: place.latitude,
    longitude: place.longitude,
  });

  const band = DISTANCE_SCORE_BANDS.find((entry) => distanceKm <= entry.maxKm);
  if (band) {
    score += band.points;
  }

  if (place.verified) {
    score += SCORE_WEIGHTS.verified;
  }

  if (place.estimatedDurationMinutes) {
    const minutes = place.estimatedDurationMinutes;
    if (
      minutes >= DURATION_SCORE_BAND.minMinutes &&
      minutes <= DURATION_SCORE_BAND.maxMinutes
    ) {
      score += SCORE_WEIGHTS.durationBand;
    }
  }

  if (request.budget && place.estimatedCostPerPerson !== undefined) {
    const perPersonBudget = request.budget / Math.max(request.numberOfPeople, 1);
    if (place.estimatedCostPerPerson <= perPersonBudget * BUDGET_FRIENDLY_FACTOR) {
      score += SCORE_WEIGHTS.budgetFriendly;
    }
  } else if (!request.budget) {
    score += SCORE_WEIGHTS.noBudget;
  }

  if (place.hiddenGem && interests.has("skrivena-mesta")) {
    score += SCORE_WEIGHTS.hiddenGem;
  }

  if (place.romantic && interests.has("romanticno")) {
    score += SCORE_WEIGHTS.romantic;
  }

  if (place.suitableForChildren && interests.has("porodicno")) {
    score += SCORE_WEIGHTS.family;
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
