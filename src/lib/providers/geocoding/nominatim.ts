import type { Coordinates } from "@/types/place";
import type { GeocodingProvider } from "@/lib/providers/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "StaDaRadim/1.0 (serbia travel planner)";

export interface GeocodeSuggestion {
  name: string;
  detail?: string;
  coordinates: Coordinates;
}

interface NominatimSearchItem {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
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
  limit = 7,
): Promise<GeocodeSuggestion[]> {
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

  const data = (await nominatimGet(`/search?${params.toString()}`)) as NominatimSearchItem[];
  return data.map(formatSuggestion);
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

export const nominatimGeocodingProvider: GeocodingProvider = {
  search: searchLocations,
};
