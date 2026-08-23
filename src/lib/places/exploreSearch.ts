import { START_CITIES } from "@/lib/constants";
import { foldSerbian } from "@/lib/format";
import { calculateDistanceKm } from "@/lib/geo/distance";
import {
  parseExploreQuery,
  placeMatchesAmenity,
  type AmenityKind,
} from "@/lib/places/amenityKeywords";
import { rememberPlaces } from "@/lib/places/placeMemory";
import {
  isNominatimSettlement,
  searchNominatimDetailed,
  settlementRadiusKm,
  type NominatimSearchItem,
} from "@/lib/providers/geocoding/nominatim";
import {
  searchOverpassAround,
  searchOverpassSerbia,
} from "@/lib/providers/places/overpass";
import type { Coordinates, Place, PlaceFilters, PlaceSource } from "@/types/place";

const LOCATION_ALIASES: Record<string, string> = {
  ruma: "ruma",
  rumi: "ruma",
  beograd: "beograd",
  beogradu: "beograd",
  belgrade: "beograd",
  bg: "beograd",
  "novi sad": "novi sad",
  "novom sadu": "novi sad",
  "novog sada": "novi sad",
  nis: "nis",
  nisu: "nis",
  subotica: "subotica",
  subotici: "subotica",
  kragujevac: "kragujevac",
  kragujevcu: "kragujevac",
  pancevo: "pancevo",
  pancevu: "pancevo",
  zemun: "zemun",
  zemunu: "zemun",
  "sremska mitrovica": "sremska mitrovica",
  "sremskoj mitrovici": "sremska mitrovica",
  sabac: "sabac",
  sapcu: "sabac",
  valjevo: "valjevo",
  valjevu: "valjevo",
  uzice: "uzice",
  uzicu: "uzice",
  cacak: "cacak",
  cacku: "cacak",
  kraljevo: "kraljevo",
  kraljevu: "kraljevo",
  smederevo: "smederevo",
  smederevu: "smederevo",
  zrenjanin: "zrenjanin",
  zrenjaninu: "zrenjanin",
  leskovac: "leskovac",
  leskovcu: "leskovac",
  vranje: "vranje",
  vranju: "vranje",
};

export interface ExploreSearchResult {
  places: Place[];
  aroundLabel?: string;
}

interface ResolvedLocation {
  label: string;
  coordinates: Coordinates;
  radiusKm: number;
  isSettlement: boolean;
}

function matchesSideFilters(place: Place, filters: PlaceFilters): boolean {
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

function textBlob(place: Place): string {
  return foldSerbian(
    `${place.name} ${place.city ?? ""} ${place.region ?? ""} ${place.shortDescription} ${place.tags.join(" ")}`,
  );
}

function isNearDuplicate(candidate: Place, existing: Place): boolean {
  if (foldSerbian(candidate.name) === foldSerbian(existing.name)) {
    const distance = calculateDistanceKm(
      { latitude: candidate.latitude, longitude: candidate.longitude },
      { latitude: existing.latitude, longitude: existing.longitude },
    );
    return distance < 1.2;
  }

  const distance = calculateDistanceKm(
    { latitude: candidate.latitude, longitude: candidate.longitude },
    { latitude: existing.latitude, longitude: existing.longitude },
  );
  return distance < 0.25 && (
    candidate.slug.startsWith(existing.slug) ||
    existing.slug.startsWith(candidate.slug) ||
    foldSerbian(candidate.name).includes(foldSerbian(existing.name)) ||
    foldSerbian(existing.name).includes(foldSerbian(candidate.name))
  );
}

function mergePlaces(groups: Place[][]): Place[] {
  const merged: Place[] = [];
  for (const group of groups) {
    for (const place of group) {
      if (!merged.some((existing) => isNearDuplicate(place, existing))) {
        merged.push(place);
      }
    }
  }
  return merged;
}

function resolveLocalSettlement(query: string): ResolvedLocation | null {
  const folded = foldSerbian(query).replace(/\s+/g, " ").trim();
  const alias = LOCATION_ALIASES[folded] ?? folded;
  const city = START_CITIES.find((entry) => foldSerbian(entry.name) === alias);
  if (!city) {
    return null;
  }
  const isLargeCity = alias === "beograd" || alias === "novi sad" || alias === "nis";
  return {
    label: city.name,
    coordinates: { latitude: city.latitude, longitude: city.longitude },
    radiusKm: isLargeCity ? 28 : 14,
    isSettlement: true,
  };
}

function locationFromNominatim(item: NominatimSearchItem): ResolvedLocation {
  const address = item.address ?? {};
  const label =
    item.name ??
    address.city ??
    address.town ??
    address.village ??
    item.display_name.split(",")[0];
  return {
    label,
    coordinates: {
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    },
    radiusKm: settlementRadiusKm(item),
    isSettlement: isNominatimSettlement(item),
  };
}

function nominatimToPlace(item: NominatimSearchItem): Place | null {
  if (isNominatimSettlement(item) || !item.osm_id || !item.osm_type) {
    return null;
  }
  if (item.class === "boundary" || item.class === "place" || item.class === "highway") {
    return null;
  }

  const name = item.name ?? item.display_name.split(",")[0];
  if (!name) {
    return null;
  }

  const address = item.address ?? {};
  const city = address.city ?? address.town ?? address.village;
  const category =
    item.class === "amenity" && item.type === "restaurant"
      ? "Hrana"
      : item.type === "swimming_pool" || item.type === "water_park"
        ? "Wellness"
        : item.class === "historic"
          ? "Istorija"
          : "Priroda";

  return {
    id: `osm-${item.osm_type}-${item.osm_id}`,
    name,
    slug: `${foldSerbian(name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "mesto"}-${item.osm_id}`,
    shortDescription: `${name} — ${[city, address.county].filter(Boolean).join(", ") || "lokacija u Srbiji"}.`,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    city,
    region: address.county ?? address.state,
    category,
    tags: item.type ? [item.type] : [],
    source: "osm" as PlaceSource,
    verified: false,
  };
}

function nearbyFromCatalog(
  catalog: Place[],
  location: ResolvedLocation,
  amenity?: AmenityKind,
): { tight: Place[]; nearby: Place[] } {
  const within = (km: number) =>
    catalog.filter((place) => {
      const distance = calculateDistanceKm(location.coordinates, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      if (distance > km) {
        return false;
      }
      if (amenity && !placeMatchesAmenity(place, amenity)) {
        return false;
      }
      return true;
    });

  const tight = within(location.radiusKm);
  return {
    tight,
    nearby: tight.length < 12 ? within(Math.max(location.radiusKm, 25)) : tight,
  };
}

function scorePlace(
  place: Place,
  query: string,
  center?: Coordinates,
): number {
  const foldedQuery = foldSerbian(query);
  const name = foldSerbian(place.name);
  let score = place.source === "internal" ? 24 : 0;
  if (place.verified) {
    score += 4;
  }
  if (name === foldedQuery) {
    score += 80;
  } else if (name.includes(foldedQuery) && foldedQuery.length > 2) {
    score += 28;
  } else if (textBlob(place).includes(foldedQuery) && foldedQuery.length > 2) {
    score += 8;
  }
  if (center) {
    const distance = calculateDistanceKm(center, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    score += Math.max(0, 36 - distance);
  }
  return score;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

async function resolveLocation(
  parsed: ReturnType<typeof parseExploreQuery>,
): Promise<{ location?: ResolvedLocation; venues: Place[] }> {
  const local =
    (parsed.locationQuery ? resolveLocalSettlement(parsed.locationQuery) : null) ??
    resolveLocalSettlement(parsed.original);

  if (local && (!parsed.locationQuery || resolveLocalSettlement(parsed.locationQuery))) {
    return { location: local, venues: [] };
  }

  const nominatimQuery = parsed.locationQuery || parsed.original;
  if (nominatimQuery.length < 2) {
    return { location: local ?? undefined, venues: [] };
  }

  try {
    const hits = await searchNominatimDetailed(nominatimQuery, 8);
    const settlement = hits.find(isNominatimSettlement);
    const venues = hits.map(nominatimToPlace).filter((place): place is Place => place !== null);
    return {
      location: settlement ? locationFromNominatim(settlement) : local ?? undefined,
      venues,
    };
  } catch {
    return { location: local ?? undefined, venues: [] };
  }
}

export async function searchExplorePlaces(
  catalog: Place[],
  filters: PlaceFilters,
): Promise<ExploreSearchResult> {
  const query = filters.query?.trim();
  if (!query) {
    return {
      places: catalog.filter((place) => matchesSideFilters(place, filters)),
    };
  }

  const parsed = parseExploreQuery(query);
  const { location, venues } = await resolveLocation(parsed);

  const textMatches = catalog.filter((place) => {
    if (!textBlob(place).includes(parsed.folded) && !textBlob(place).includes(foldSerbian(parsed.locationQuery || query))) {
      if (parsed.amenity && placeMatchesAmenity(place, parsed.amenity) && !parsed.locationQuery) {
        return matchesSideFilters(place, filters);
      }
      return false;
    }
    return matchesSideFilters(place, filters);
  });

  const around = location?.isSettlement
    ? nearbyFromCatalog(catalog, location, parsed.amenity)
    : { tight: [], nearby: [] };
  const nearby = around.nearby.filter((place) => matchesSideFilters(place, filters));

  let live: Place[] = [];
  const shouldFetchLive = Boolean(
    parsed.amenity || (location && around.tight.length < 20),
  );
  try {
    if (location && shouldFetchLive) {
      const radiusMeters = Math.round(
        (parsed.amenity === "pool" ? Math.max(location.radiusKm, 12) : location.radiusKm) * 1000,
      );
      live = await withTimeout(
        searchOverpassAround({
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
          radiusMeters,
          amenity: parsed.amenity,
          includeLocalFood: Boolean(!parsed.amenity && location.radiusKm <= 16),
        }),
        12000,
        [],
      );
    } else if (parsed.amenity) {
      const amenityHits = catalog.filter((place) =>
        placeMatchesAmenity(place, parsed.amenity as AmenityKind),
      );
      if (amenityHits.length < 30) {
        live = await withTimeout(searchOverpassSerbia(parsed.amenity), 12000, []);
      }
    }
  } catch {
    live = [];
  }

  if (location) {
    live = live.map((place) => ({
      ...place,
      city: place.city ?? location.label,
    }));
  }

  const merged = mergePlaces([textMatches, venues, nearby, live]).filter((place) =>
    matchesSideFilters(place, filters),
  );

  const center = location?.coordinates;
  merged.sort(
    (a, b) =>
      scorePlace(b, parsed.locationQuery || query, center) -
      scorePlace(a, parsed.locationQuery || query, center),
  );

  rememberPlaces(merged);

  return {
    places: merged,
    aroundLabel: location?.isSettlement ? location.label : undefined,
  };
}
