import { MOCK_LODGING } from "@/data/mockLodging";
import { MOCK_PLACES } from "@/data/mockPlaces";
import { withPlaceImage } from "@/lib/places/placeImage";
import { calculateDistanceKm } from "@/lib/geo/distance";
import {
  applyPlaceOverlay,
  getPlaceRowByKey,
  getPlaceRowBySlug,
  listPublishedCommunityPlaces,
  listVisibleCoverUrls,
  placeFromRow,
} from "@/lib/places/canonical";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

async function listCommunityPlaces(): Promise<Place[]> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return [];
    }
    return await listPublishedCommunityPlaces(supabase);
  } catch {
    return [];
  }
}

async function withOverlay(place: Place | null): Promise<Place | null> {
  if (!place) {
    return null;
  }
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return withPlaceImage(place);
    }
    const row = await getPlaceRowByKey(supabase, place.id);
    return withPlaceImage(applyPlaceOverlay(place, row));
  } catch {
    return withPlaceImage(place);
  }
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
  const community = await listCommunityPlaces();
  for (const place of community) {
    const duplicate = merged.some((existing) => existing.id === place.id || isNearDuplicate(place, existing));
    if (!duplicate) {
      merged.push(place);
    }
  }
  const stripped = merged.map(withPlaceImage);
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return stripped;
    }
    const covers = await listVisibleCoverUrls(supabase);
    return stripped.map((place) =>
      place.imageUrl ? place : { ...place, imageUrl: covers.get(place.id) },
    );
  } catch {
    return stripped;
  }
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
      const overlaid = await withOverlay(lodging);
      return overlaid ? withPlaceImage(overlaid) : null;
    }
    const internal = await mockPlaceRepository.getPlaceById(id);
    if (internal) {
      return withOverlay(internal);
    }
    const catalog = (await listCatalog()).find((place) => place.id === id);
    if (catalog) {
      return withOverlay(catalog);
    }
    return withOverlay(await lookupRememberedOrOsm(id, "id"));
  },
  async getPlaceBySlug(slug) {
    const lodging = MOCK_LODGING.find((place) => place.slug === slug);
    if (lodging) {
      const overlaid = await withOverlay(lodging);
      return overlaid ? withPlaceImage(overlaid) : null;
    }
    const internal = await mockPlaceRepository.getPlaceBySlug(slug);
    if (internal) {
      return withOverlay(internal);
    }
    const catalog = (await listCatalog()).find((place) => place.slug === slug);
    if (catalog) {
      return withOverlay(catalog);
    }
    const remembered = await lookupRememberedOrOsm(slug, "slug");
    if (remembered) {
      return withOverlay(remembered);
    }
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const row = await getPlaceRowBySlug(supabase, slug);
        if (row) {
          return placeFromRow(row);
        }
      }
    } catch {
      return null;
    }
    return null;
  },
  async searchPlaces(filters) {
    const result = await searchExplorePlaces(await listCatalog(), filters);
    return result.places;
  },
};

export async function searchCatalogExplore(filters: PlaceFilters) {
  return searchExplorePlaces(await listCatalog(), filters);
}
