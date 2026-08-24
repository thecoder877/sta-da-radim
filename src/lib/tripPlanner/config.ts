import type { DurationPreset, TransportType, TravelStyle } from "@/types/trip";

/**
 * Central tuning constants for the deterministic planner. Keeping the "magic
 * numbers" in one place makes the scoring/filtering behavior easy to reason
 * about and to lock down with tests.
 */

/** Only keep places costing at most this fraction of the per-person budget. */
export const BUDGET_HEADROOM_FACTOR = 0.7;

/** A place priced under this fraction of the per-person budget scores a bonus. */
export const BUDGET_FRIENDLY_FACTOR = 0.5;

export const SCORE_WEIGHTS = {
  interestTagMatch: 10,
  interestCategoryMatch: 10,
  verified: 3,
  durationBand: 2,
  budgetFriendly: 5,
  noBudget: 1,
  hiddenGem: 4,
  romantic: 3,
  family: 3,
} as const;

/** Distance-decay scoring bands (first matching band wins). */
export const DISTANCE_SCORE_BANDS: { maxKm: number; points: number }[] = [
  { maxKm: 25, points: 8 },
  { maxKm: 50, points: 5 },
  { maxKm: 100, points: 2 },
];

/** Visit-duration sweet spot (minutes) that earns a scoring bonus. */
export const DURATION_SCORE_BAND = { minMinutes: 40, maxMinutes: 180 };

/** Target number of stops per duration preset. */
export const STOP_COUNT_BY_PRESET: Record<DurationPreset, number> = {
  hours: 3,
  "1": 5,
  "2": 8,
  "3": 11,
  "4plus": 13,
};

/** Stops per day when no duration preset is provided. */
export const STOPS_PER_DAY = 4;

/** Adjustment to the target stop count based on travel pace. */
export const TRAVEL_STYLE_STOP_DELTA: Record<TravelStyle, number> = {
  relaxed: -2,
  balanced: 0,
  packed: 2,
};

/** Never build a plan with fewer than this many stops. */
export const MIN_STOPS = 2;

/** Assumed average speed (km/h) per transport mode for time estimates. */
export const TRAVEL_SPEED_KMH: Record<TransportType, number> = {
  car: 55,
  bus: 40,
  train: 50,
  walk: 4.5,
  bike: 14,
};
