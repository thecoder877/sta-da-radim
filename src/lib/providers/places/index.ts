import { catalogPlaceRepository } from "@/lib/providers/places/catalogPlaceRepository";
import type { PlaceRepository } from "@/lib/providers/types";

/**
 * Internal curated places plus OpenStreetMap coverage for Serbia.
 * Swap for a Supabase-backed repository in Phase 2.
 */
export function getPlaceRepository(): PlaceRepository {
  return catalogPlaceRepository;
}
