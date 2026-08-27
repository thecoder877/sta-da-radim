import { MOCK_PLACES } from "@/data/mockPlaces";
import { calculateDistanceKm } from "@/lib/geo/distance";
import type { PlaceRepository } from "@/lib/providers/types";
import type { Place, PlaceFilters } from "@/types/place";

function matchesFilters(place: Place, filters: PlaceFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const blob =
      `${place.name} ${place.city ?? ""} ${place.region ?? ""} ${place.shortDescription} ${place.tags.join(" ")}`.toLowerCase();
    if (!blob.includes(q)) {
      return false;
    }
  }

  if (
    filters.category &&
    place.category.toLowerCase() !== filters.category.toLowerCase()
  ) {
    return false;
  }

  if (filters.region && place.region !== filters.region) {
    return false;
  }

  if (filters.freeOnly && (place.estimatedCostPerPerson ?? 0) > 0) {
    return false;
  }

  if (filters.paidOnly && (place.estimatedCostPerPerson ?? 0) === 0) {
    return false;
  }

  if (
    filters.environment &&
    place.environment !== filters.environment &&
    place.environment !== "mixed"
  ) {
    return false;
  }

  if (filters.suitableForChildren && !place.suitableForChildren) {
    return false;
  }

  if (filters.romantic && !place.romantic) {
    return false;
  }

  if (filters.hiddenGem && !place.hiddenGem) {
    return false;
  }

  if (filters.maxDistanceKm && filters.from) {
    const distance = calculateDistanceKm(filters.from, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    if (distance > filters.maxDistanceKm) {
      return false;
    }
  }

  return true;
}

export const mockPlaceRepository: PlaceRepository = {
  async listPlaces() {
    return MOCK_PLACES;
  },
  async getPlaceById(id) {
    return MOCK_PLACES.find((place) => place.id === id) ?? null;
  },
  async getPlaceBySlug(slug) {
    return MOCK_PLACES.find((place) => place.slug === slug) ?? null;
  },
  async searchPlaces(filters) {
    return MOCK_PLACES.filter((place) => matchesFilters(place, filters));
  },
};
