import { fetchWithTimeout } from "@/lib/providers/http";
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

function formatSuggestion(item: NominatimSearchItem): GeocodeSuggestion {
  const address = item.address ?? {};
  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    item.name ??
    item.display_name.split(",")[0];
  const region = address.county ?? address.state;
  const detail = [address.road, locality, region]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(", ");

  return {
    name: locality,
    detail: detail !== locality ? detail : undefined,
    coordinates: {
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    },
  };
}

async function nominatimGet(path: string): Promise<unknown> {
  const response = await fetchWithTimeout(`${NOMINATIM_URL}${path}`, {
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
  limit = 7,
): Promise<GeocodeSuggestion[]> {
  return (await searchNominatimDetailed(query, limit)).map(formatSuggestion);
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
    zoom: "12",
  });

  const data = (await nominatimGet(`/reverse?${params.toString()}`)) as NominatimSearchItem;
  if (!data?.lat) {
    return null;
  }
  return formatSuggestion(data);
}
