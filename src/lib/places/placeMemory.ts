import type { Place } from "@/types/place";

const rememberedBySlug = new Map<string, Place>();
const rememberedById = new Map<string, Place>();

export function rememberPlaces(places: Place[]): void {
  for (const place of places) {
    rememberedBySlug.set(place.slug, place);
    rememberedById.set(place.id, place);
  }
}

export function recallPlaceBySlug(slug: string): Place | null {
  return rememberedBySlug.get(slug) ?? null;
}

export function recallPlaceById(id: string): Place | null {
  return rememberedById.get(id) ?? null;
}

export function extractOsmNumericId(value: string): number | null {
  const prefixed = value.match(/^osm-(?:node|way|relation)-(\d+)$/);
  if (prefixed) {
    return Number(prefixed[1]);
  }
  const slugSuffix = value.match(/-(\d+)$/);
  if (slugSuffix) {
    return Number(slugSuffix[1]);
  }
  return null;
}
