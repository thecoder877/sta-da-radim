import { MOCK_LODGING } from "@/data/mockLodging";
import { MOCK_PLACES } from "@/data/mockPlaces";
import { calculateDistanceKm } from "@/lib/geo/distance";
import { searchExplorePlaces } from "@/lib/places/exploreSearch";
import {
  extractOsmNumericId,
  recallPlaceById,
  recallPlaceBySlug,
  rememberPlaces,
} from "@/lib/places/placeMemory";
import { mockPlaceRepository } from "@/lib/providers/places/mockPlaceRepository";
import { fetchOverpassByOsmId, fetchOverpassPlaces } from "@/lib/providers/places/overpass";
import type { PlaceRepository } from "@/lib/providers/types";
import type { Place, PlaceFilters } from "@/types/place";

// Merge-time dedup: drop an OSM place that overlaps a curated MOCK place.
function isCatalogNearDuplicate(candidate: Place, existing: Place): boolean {
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

// Merging MOCK_PLACES with the OSM snapshot is O(n*m); cache the result so
// repeated trip generations and Explore searches do not rebuild it every call.
const CATALOG_CACHE_MS = 1000 * 60 * 60 * 12;
let catalogCache: { places: Place[]; fetchedAt: number } | null = null;

async function listCatalog(): Promise<Place[]> {
  if (catalogCache && Date.now() - catalogCache.fetchedAt < CATALOG_CACHE_MS) {
    return catalogCache.places;
  }

  let osmPlaces: Place[] = [];
  try {
    osmPlaces = await fetchOverpassPlaces();
  } catch {
    osmPlaces = [];
  }

  const merged = [...MOCK_PLACES];
  for (const place of osmPlaces) {
    const duplicate = merged.some((existing) => isCatalogNearDuplicate(place, existing));
    if (!duplicate) {
      merged.push(place);
    }
  }

  catalogCache = { places: merged, fetchedAt: Date.now() };
  return merged;
}

async function lookupRememberedOrOsm(value: string, by: "id" | "slug"): Promise<Place | null> {
  const remembered = by === "id" ? recallPlaceById(value) : recallPlaceBySlug(value);
  if (remembered) {
    return remembered;
  }

  const osmId = extractOsmNumericId(value);
  if (!osmId) {
    return null;
  }
  const fromOsm = await fetchOverpassByOsmId(osmId);
  if (fromOsm) {
    rememberPlaces([fromOsm]);
  }
  return fromOsm;
}

export const catalogPlaceRepository: PlaceRepository = {
  async listPlaces() {
    return listCatalog();
  },
  async getPlaceById(id) {
    const lodging = MOCK_LODGING.find((place) => place.id === id);
    if (lodging) {
      return lodging;
    }
    const internal = await mockPlaceRepository.getPlaceById(id);
    if (internal) {
      return internal;
    }
    const catalog = (await listCatalog()).find((place) => place.id === id);
    if (catalog) {
      return catalog;
    }
    return lookupRememberedOrOsm(id, "id");
  },
  async getPlaceBySlug(slug) {
    const lodging = MOCK_LODGING.find((place) => place.slug === slug);
    if (lodging) {
      return lodging;
    }
    const internal = await mockPlaceRepository.getPlaceBySlug(slug);
    if (internal) {
      return internal;
    }
    const catalog = (await listCatalog()).find((place) => place.slug === slug);
    if (catalog) {
      return catalog;
    }
    return lookupRememberedOrOsm(slug, "slug");
  },
  async searchPlaces(filters) {
    const result = await searchExplorePlaces(await listCatalog(), filters);
    return result.places;
  },
};

export async function searchCatalogExplore(filters: PlaceFilters) {
  return searchExplorePlaces(await listCatalog(), filters);
}
