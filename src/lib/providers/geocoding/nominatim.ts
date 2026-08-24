import { foldSerbian } from "../../format.ts";
import { suggestStartCities } from "../../locations.ts";
import type { GeocodingProvider } from "@/lib/providers/types";
import type { Coordinates } from "@/types/place";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "StaDaRadim/1.0 (serbia travel planner)";

export interface GeocodeSuggestion {
  name: string;
  detail?: string;
  coordinates: Coordinates;
}

export interface NominatimSearchItem {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class?: string;
  type?: string;
  addresstype?: string;
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    road?: string;
    suburb?: string;
    country?: string;
    hamlet?: string;
  };
}

const SETTLEMENT_TYPES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "suburb",
  "neighbourhood",
  "hamlet",
  "isolated_dwelling",
  "quarter",
  "city_district",
  "county",
  "state",
  "region",
  "province",
  "administrative",
]);

const TYPE_RANK: Record<string, number> = {
  village: 0,
  hamlet: 1,
  isolated_dwelling: 2,
  suburb: 3,
  neighbourhood: 4,
  quarter: 5,
  town: 6,
  city: 7,
  city_district: 8,
  municipality: 20,
  administrative: 21,
  county: 22,
  state: 23,
  region: 24,
  province: 25,
};

export function isNominatimSettlement(item: NominatimSearchItem): boolean {
  const kind = item.addresstype ?? item.type ?? "";
  if (item.class === "boundary" && item.type === "administrative") {
    return true;
  }
  if (item.class === "place" && SETTLEMENT_TYPES.has(item.type ?? "")) {
    return true;
  }
  return SETTLEMENT_TYPES.has(kind);
}

export function settlementRadiusKm(item: NominatimSearchItem): number {
  const kind = item.addresstype ?? item.type ?? "";
  if (kind === "city" || kind === "state" || kind === "county" || kind === "region") {
    return 28;
  }
  if (kind === "town" || kind === "municipality") {
    return 14;
  }
  if (kind === "suburb" || kind === "city_district" || kind === "quarter") {
    return 8;
  }
  return 10;
}

function uniqueParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) {
      continue;
    }
    const key = foldSerbian(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function formatSuggestion(item: NominatimSearchItem): GeocodeSuggestion {
  const address = item.address ?? {};
  const title =
    item.name?.trim() ||
    item.display_name.split(",")[0]?.trim() ||
    address.village ||
    address.hamlet ||
    address.town ||
    address.city ||
    "Lokacija";

  const settlement =
    address.village ??
    address.hamlet ??
    address.town ??
    address.city ??
    address.suburb;
  const detail = uniqueParts([
    address.road,
    settlement,
    address.municipality,
    address.county ?? address.state,
  ]).filter(
    (part) => foldSerbian(part) !== foldSerbian(title),
  );

  return {
    name: title,
    detail: detail.length > 0 ? detail.join(", ") : undefined,
    coordinates: {
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    },
  };
}

export function nominatimKind(item: NominatimSearchItem): string {
  return item.addresstype ?? item.type ?? "";
}

export function rankNominatimResults(
  items: NominatimSearchItem[],
  query: string,
): NominatimSearchItem[] {
  const foldedQuery = foldSerbian(query.trim());

  return [...items].sort((left, right) => {
    const leftName = foldSerbian(left.name ?? left.display_name.split(",")[0] ?? "");
    const rightName = foldSerbian(right.name ?? right.display_name.split(",")[0] ?? "");
    const leftRank =
      (TYPE_RANK[nominatimKind(left)] ?? 15) +
      (leftName === foldedQuery ? -5 : leftName.startsWith(foldedQuery) ? -2 : 0);
    const rightRank =
      (TYPE_RANK[nominatimKind(right)] ?? 15) +
      (rightName === foldedQuery ? -5 : rightName.startsWith(foldedQuery) ? -2 : 0);
    return leftRank - rightRank;
  });
}

function roughlySamePoint(left: GeocodeSuggestion, right: GeocodeSuggestion): boolean {
  return (
    Math.abs(left.coordinates.latitude - right.coordinates.latitude) < 0.02 &&
    Math.abs(left.coordinates.longitude - right.coordinates.longitude) < 0.02
  );
}

export function mergeStartLocationSuggestions(
  query: string,
  remote: GeocodeSuggestion[],
  limit = 8,
): GeocodeSuggestion[] {
  const local = suggestStartCities(query, 6).map((city) => ({
    name: city.name,
    detail: "Srbija",
    coordinates: {
      latitude: city.latitude,
      longitude: city.longitude,
    },
  }));

  const merged: GeocodeSuggestion[] = [];
  for (const item of [...local, ...remote]) {
    const duplicate = merged.find(
      (existing) =>
        foldSerbian(existing.name) === foldSerbian(item.name) ||
        roughlySamePoint(existing, item),
    );
    if (duplicate) {
      continue;
    }
    merged.push(item);
    if (merged.length >= limit) {
      break;
    }
  }
  return merged;
}

async function nominatimGet(path: string): Promise<unknown> {
  const response = await fetch(`${NOMINATIM_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      "Accept-Language": "sr-Latn,sr,en",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("GEOCODE_FAILED");
  }

  return response.json();
}

export async function searchLocations(
  query: string,
  limit = 8,
): Promise<GeocodeSuggestion[]> {
  const items = rankNominatimResults(await searchNominatimDetailed(query, 15), query);
  const suggestions = items.map(formatSuggestion);
  return mergeStartLocationSuggestions(query, suggestions, limit);
}

export async function searchNominatimDetailed(
  query: string,
  limit = 8,
): Promise<NominatimSearchItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "rs",
    limit: String(limit),
  });

  return (await nominatimGet(`/search?${params.toString()}`)) as NominatimSearchItem[];
}

export async function reverseGeocode(
  coordinates: Coordinates,
): Promise<GeocodeSuggestion | null> {
  const params = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "16",
  });

  const data = (await nominatimGet(`/reverse?${params.toString()}`)) as NominatimSearchItem;
  if (!data?.lat) {
    return null;
  }
  return formatSuggestion(data);
}

export const nominatimGeocodingProvider: GeocodingProvider = {
  search: searchLocations,
};
