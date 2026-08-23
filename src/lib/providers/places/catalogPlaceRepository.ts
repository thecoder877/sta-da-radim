import { MOCK_PLACES } from "@/data/mockPlaces";
import { calculateDistanceKm } from "@/lib/geo/distance";
import { mockPlaceRepository } from "@/lib/providers/places/mockPlaceRepository";
import { fetchOverpassPlaces } from "@/lib/providers/places/overpass";
import type { PlaceRepository } from "@/lib/providers/types";
import type { Place, PlaceFilters } from "@/types/place";

function isNearDuplicate(candidate: Place, existing: Place): boolean {
  if (candidate.name.toLowerCase() === existing.name.toLowerCase()) {
    return true;
  }

  const distance = calculateDistanceKm(
    { latitude: candidate.latitude, longitude: candidate.longitude },
    { latitude: existing.latitude, longitude: existing.longitude },
  );

  return (
    distance < 0.4 &&
    (candidate.slug.startsWith(existing.slug) ||
      existing.slug.startsWith(candidate.slug) ||
      candidate.name.toLowerCase().includes(existing.name.toLowerCase()) ||
      existing.name.toLowerCase().includes(candidate.name.toLowerCase()))
  );
}

async function listCatalog(): Promise<Place[]> {
  let osmPlaces: Place[] = [];
  try {
    osmPlaces = await fetchOverpassPlaces();
  } catch {
    osmPlaces = [];
  }

  const merged = [...MOCK_PLACES];
  for (const place of osmPlaces) {
    const duplicate = merged.some((existing) => isNearDuplicate(place, existing));
    if (!duplicate) {
      merged.push(place);
    }
  }
  return merged;
}

function matchesFilters(place: Place, filters: PlaceFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const blob = `${place.name} ${place.city ?? ""} ${place.region ?? ""} ${place.shortDescription} ${place.tags.join(" ")}`.toLowerCase();
    if (!blob.includes(q)) {
      return false;
    }
  }

  if (filters.category && place.category.toLowerCase() !== filters.category.toLowerCase()) {
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

  if (filters.environment && place.environment !== filters.environment && place.environment !== "mixed") {
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

export const catalogPlaceRepository: PlaceRepository = {
  async listPlaces() {
    return listCatalog();
  },
  async getPlaceById(id) {
    const internal = await mockPlaceRepository.getPlaceById(id);
    if (internal) {
      return internal;
    }
    return (await listCatalog()).find((place) => place.id === id) ?? null;
  },
  async getPlaceBySlug(slug) {
    const internal = await mockPlaceRepository.getPlaceBySlug(slug);
    if (internal) {
      return internal;
    }
    return (await listCatalog()).find((place) => place.slug === slug) ?? null;
  },
  async searchPlaces(filters) {
    return (await listCatalog()).filter((place) => matchesFilters(place, filters));
  },
};
