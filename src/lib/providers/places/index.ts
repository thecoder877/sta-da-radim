import { catalogPlaceRepository } from "@/lib/providers/places/catalogPlaceRepository";
import type { PlaceRepository } from "@/lib/providers/types";

export { searchCatalogExplore } from "@/lib/providers/places/catalogPlaceRepository";

/**
 * Internal curated places plus OpenStreetMap coverage for Serbia.
 * Swap for a Supabase-backed repository in Phase 2.
 */
export function getPlaceRepository(): PlaceRepository {
  return catalogPlaceRepository;
}
