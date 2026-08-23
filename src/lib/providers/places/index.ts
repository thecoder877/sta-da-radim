import { mockPlaceRepository } from "@/lib/providers/places/mockPlaceRepository";
import type { PlaceRepository } from "@/lib/providers/types";

/**
 * Swap this factory for a Supabase-backed repository in Phase 2.
 * UI code should depend on PlaceRepository, not on mock data files.
 */
export function getPlaceRepository(): PlaceRepository {
  return mockPlaceRepository;
}
