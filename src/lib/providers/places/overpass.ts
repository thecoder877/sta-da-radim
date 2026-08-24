import { slugify } from "@/lib/format";
import type { AmenityKind } from "@/lib/places/amenityKeywords";
import { imageFromOsmTags, withPlaceImage } from "@/lib/places/placeImage";
import type { Place, PlaceEnvironment, PlaceSource } from "@/types/place";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const SERBIA_BBOX = "42.23,18.81,46.19,23.01";
const CACHE_MS = 1000 * 60 * 60 * 12;
const LIVE_CACHE_MS = 1000 * 60 * 15;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

let memoryCache: { places: Place[]; fetchedAt: number } | null = null;
const liveCache = new Map<string, { places: Place[]; fetchedAt: number }>();

const QUERY = `
[out:json][timeout:90];
(
  nwr["tourism"~"attraction|viewpoint|museum|zoo|theme_park|gallery"]["name"](${SERBIA_BBOX});
  nwr["historic"~"castle|ruins|monastery|monument|archaeological_site|fort|memorial|church"]["name"](${SERBIA_BBOX});
  nwr["leisure"="nature_reserve"]["name"](${SERBIA_BBOX});
  nwr["natural"~"peak|cave_entrance|cliff|spring"]["name"](${SERBIA_BBOX});
  nwr["boundary"="protected_area"]["protect_class"~"1|2|3|4"]["name"](${SERBIA_BBOX});
);
out center tags;
`.trim();

function isPoolTags(tags: Record<string, string>): boolean {
  return (
    tags.leisure === "swimming_pool" ||
    tags.amenity === "swimming_pool" ||
    tags.leisure === "water_park" ||
    tags.leisure === "swimming_area"
  );
}

function mapCategory(tags: Record<string, string>): { category: string; tags: string[] } {
  if (isPoolTags(tags)) {
    return { category: "Wellness", tags: ["bazen", "kupanje"] };
  }
  if (tags.leisure === "spa" || tags.amenity === "spa" || tags.leisure === "sauna") {
    return { category: "Wellness", tags: ["spa", "wellness"] };
  }
  if (tags.amenity === "restaurant" || tags.amenity === "fast_food" || tags.amenity === "food_court") {
    return { category: "Hrana", tags: ["restorani"] };
  }
  if (tags.amenity === "cafe" || tags.amenity === "bar" || tags.amenity === "pub") {
    return { category: "Hrana", tags: ["kafici"] };
  }
  if (tags.leisure === "park" || tags.leisure === "garden") {
    return { category: "Priroda", tags: ["park", "šetnja"] };
  }
  if (tags.leisure === "sports_centre" || tags.leisure === "stadium" || tags.leisure === "pitch") {
    return { category: "Avantura", tags: ["sport"] };
  }
  if (tags.natural === "beach") {
    return { category: "Priroda", tags: ["kupanje", "plaža"] };
  }
  if (tags.historic === "monastery" || tags.amenity === "place_of_worship") {
    return { category: "Istorija", tags: ["manastiri", "istorija"] };
  }
  if (tags.tourism === "museum" || tags.tourism === "gallery") {
    return { category: "Istorija", tags: ["muzeji", "istorija"] };
  }
  if (
    tags.historic === "castle" ||
    tags.historic === "ruins" ||
    tags.historic === "fort" ||
    tags.historic === "archaeological_site"
  ) {
    return { category: "Istorija", tags: ["istorija", "fotografija"] };
  }
  if (tags.tourism === "viewpoint" || tags.natural === "peak" || tags.natural === "cliff") {
    return { category: "Priroda", tags: ["vidikovci", "priroda", "fotografija"] };
  }
  if (tags.natural === "cave_entrance") {
    return { category: "Avantura", tags: ["avantura", "priroda"] };
  }
  if (tags.leisure === "nature_reserve" || tags.boundary === "protected_area") {
    return { category: "Priroda", tags: ["priroda", "planinarenje"] };
  }
  if (tags.tourism === "zoo" || tags.tourism === "theme_park") {
    return { category: "Porodično", tags: ["porodicno"] };
  }
  if (
    tags.tourism === "hotel" ||
    tags.tourism === "guest_house" ||
    tags.tourism === "hostel" ||
    tags.tourism === "motel" ||
    tags.tourism === "apartment" ||
    tags.tourism === "chalet"
  ) {
    return { category: "Smeštaj", tags: ["hotel", "prenociste"] };
  }
  if (tags.amenity === "cinema" || tags.amenity === "theatre" || tags.amenity === "arts_centre") {
    return { category: "Istorija", tags: ["kultura"] };
  }
  if (tags.amenity === "nightclub" || tags.amenity === "bar") {
    return { category: "Noćni život", tags: ["nocni-zivot"] };
  }
  return { category: "Priroda", tags: ["priroda"] };
}

function environmentFor(tags: Record<string, string>): PlaceEnvironment {
  if (isPoolTags(tags)) {
    return tags.covered === "yes" || tags.indoor === "yes" ? "indoor" : "mixed";
  }
  if (tags.tourism === "museum" || tags.tourism === "gallery" || tags.amenity === "cinema") {
    return "indoor";
  }
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") {
    return "mixed";
  }
  return "outdoor";
}

function resolveName(tags: Record<string, string>, allowUnnamedPools: boolean): string | null {
  const named =
    tags.name?.trim() ||
    tags["name:sr-Latn"]?.trim() ||
    tags["name:sr"]?.trim() ||
    tags["name:en"]?.trim();
  if (named) {
    return named;
  }
  if (allowUnnamedPools && isPoolTags(tags)) {
    const street = tags["addr:street"];
    const operator = tags.operator;
    if (street) {
      return `Bazen · ${street}`;
    }
    if (operator) {
      return `Bazen · ${operator}`;
    }
    return "Bazen";
  }
  return null;
}

export function placesFromOverpassElements(
  elements: OverpassElement[],
  options?: { allowUnnamedPools?: boolean },
): Place[] {
  const allowUnnamedPools = options?.allowUnnamedPools ?? false;
  const unique = new Map<string, Place>();

  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = resolveName(tags, allowUnnamedPools);
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude === undefined || longitude === undefined) {
      continue;
    }

    const mapped = mapCategory(tags);
    const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["is_in:city"];
    const region = tags["is_in"] ?? tags["addr:province"];
    const description =
      tags.description ??
      tags["description:sr"] ??
      `${name} — lokacija sa otvorene mape Srbije.`;

    const place: Place = withPlaceImage({
      id: `osm-${element.type}-${element.id}`,
      name,
      slug: `${slugify(name)}-${element.id}`,
      shortDescription: description.slice(0, 160),
      description,
      latitude,
      longitude,
      city,
      region,
      category: mapped.category,
      tags: [...new Set(mapped.tags)],
      website: tags.website ?? tags["contact:website"],
      imageUrl: imageFromOsmTags(tags),
      source: "osm" as PlaceSource,
      verified: Boolean(tags.wikipedia || tags.wikidata),
      environment: environmentFor(tags),
      suitableForChildren: isPoolTags(tags) || tags.tourism === "zoo" || tags.leisure === "park",
    });

    const key = `${place.name.toLowerCase()}|${place.latitude.toFixed(3)}|${place.longitude.toFixed(3)}`;
    if (!unique.has(key)) {
      unique.set(key, place);
    }
  }

  return [...unique.values()];
}

function amenitySelectors(amenity?: AmenityKind, includeLocalFood = false): string[] {
  if (amenity === "pool") {
    return [
      'nwr["leisure"="swimming_pool"]',
      'nwr["amenity"="swimming_pool"]',
      'nwr["leisure"="water_park"]',
      'nwr["leisure"="swimming_area"]',
    ];
  }
  if (amenity === "spa") {
    return [
      'nwr["leisure"="spa"]["name"]',
      'nwr["amenity"="spa"]["name"]',
      'nwr["leisure"="sauna"]["name"]',
    ];
  }
  if (amenity === "restaurant") {
    return ['nwr["amenity"="restaurant"]["name"]'];
  }
  if (amenity === "cafe") {
    return ['nwr["amenity"~"cafe|bar|pub"]["name"]'];
  }
  if (amenity === "lake") {
    return [
      'nwr["natural"="water"]["name"]',
      'nwr["water"="lake"]["name"]',
      'nwr["leisure"="swimming_area"]["name"]',
    ];
  }
  if (amenity === "monastery") {
    return ['nwr["historic"="monastery"]["name"]', 'nwr["amenity"="place_of_worship"]["name"]'];
  }
  if (amenity === "museum") {
    return ['nwr["tourism"~"museum|gallery"]["name"]'];
  }
  if (amenity === "park") {
    return ['nwr["leisure"~"park|garden"]["name"]'];
  }
  if (amenity === "beach") {
    return ['nwr["natural"="beach"]["name"]'];
  }
  if (amenity === "viewpoint") {
    return ['nwr["tourism"="viewpoint"]["name"]', 'nwr["natural"="peak"]["name"]'];
  }
  if (amenity === "fortress") {
    return ['nwr["historic"~"castle|fort|ruins"]["name"]'];
  }
  if (amenity === "nightlife") {
    return ['nwr["amenity"~"bar|pub|nightclub"]["name"]'];
  }
  if (amenity === "sport") {
    return [
      'nwr["leisure"="sports_centre"]["name"]',
      'nwr["leisure"="stadium"]["name"]',
    ];
  }

  const core = [
    'nwr["tourism"~"attraction|viewpoint|museum|zoo|theme_park|gallery"]["name"]',
    'nwr["historic"~"castle|ruins|monastery|monument|archaeological_site|fort|memorial|church"]["name"]',
    'nwr["leisure"~"park|swimming_pool|sports_centre|water_park|nature_reserve|stadium"]["name"]',
    'nwr["amenity"~"place_of_worship|cinema|theatre|arts_centre"]["name"]',
    'nwr["natural"~"peak|cave_entrance|spring|beach"]["name"]',
  ];
  if (includeLocalFood) {
    core.push('nwr["amenity"~"restaurant|cafe|pub"]["name"]');
  }
  return core;
}

async function overpassQuery(query: string): Promise<OverpassElement[]> {
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "StaDaRadim/1.0 (serbia travel planner)",
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as OverpassResponse;
        return payload.elements ?? [];
      }
    } catch {
      // try next mirror
    }
  }
  return [];
}

function clusterUnnamedPools(places: Place[]): Place[] {
  const named = places.filter((place) => !place.name.startsWith("Bazen"));
  const unnamed = places.filter((place) => place.name.startsWith("Bazen"));
  const kept: Place[] = [];

  for (const candidate of unnamed) {
    const tooClose = [...kept, ...named].some((existing) => {
      const dlat = candidate.latitude - existing.latitude;
      const dlng = candidate.longitude - existing.longitude;
      return dlat * dlat + dlng * dlng < 0.0008 * 0.0008;
    });
    if (!tooClose) {
      kept.push(candidate);
    }
  }

  return [...named, ...kept];
}

export async function searchOverpassAround(options: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  amenity?: AmenityKind;
  includeLocalFood?: boolean;
}): Promise<Place[]> {
  const key = [
    options.latitude.toFixed(3),
    options.longitude.toFixed(3),
    options.radiusMeters,
    options.amenity ?? "all",
    options.includeLocalFood ? "food" : "nofood",
  ].join("|");

  const cached = liveCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < LIVE_CACHE_MS) {
    return cached.places;
  }

  const around = `(around:${Math.round(options.radiusMeters)},${options.latitude},${options.longitude})`;
  const selectors = amenitySelectors(options.amenity, options.includeLocalFood);
  const query = `
[out:json][timeout:40];
(
  ${selectors.map((selector) => `${selector}${around};`).join("\n  ")}
);
out center tags;
`.trim();

  const elements = await overpassQuery(query);
  const allowUnnamedPools = options.amenity === "pool";
  let places = placesFromOverpassElements(elements, { allowUnnamedPools });
  if (allowUnnamedPools) {
    places = clusterUnnamedPools(places);
  }

  liveCache.set(key, { places, fetchedAt: Date.now() });
  return places;
}

export async function searchOverpassSerbia(amenity: AmenityKind): Promise<Place[]> {
  const key = `serbia|${amenity}`;
  const cached = liveCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < LIVE_CACHE_MS) {
    return cached.places;
  }

  const selectors = amenitySelectors(amenity);
  const query = `
[out:json][timeout:90];
area["ISO3166-1"="RS"][admin_level=2]->.rs;
(
  ${selectors.map((selector) => `${selector}(area.rs);`).join("\n  ")}
);
out center tags;
`.trim();

  const elements = await overpassQuery(query);
  let places = placesFromOverpassElements(elements, { allowUnnamedPools: amenity === "pool" });
  if (amenity === "pool") {
    places = clusterUnnamedPools(places).filter((place) => !place.name.startsWith("Bazen") || place.name.includes("·"));
  }

  liveCache.set(key, { places, fetchedAt: Date.now() });
  return places;
}

export async function searchOverpassLodging(
  latitude: number,
  longitude: number,
  radiusMeters = 12000,
): Promise<Place[]> {
  const around = `(around:${Math.round(radiusMeters)},${latitude},${longitude})`;
  const query = `
[out:json][timeout:25];
(
  nwr["tourism"="hotel"]["name"]${around};
  nwr["tourism"="guest_house"]["name"]${around};
  nwr["tourism"="hostel"]["name"]${around};
  nwr["tourism"="motel"]["name"]${around};
  nwr["tourism"="apartment"]["name"]${around};
);
out center tags;
`.trim();

  const elements = await overpassQuery(query);
  return placesFromOverpassElements(elements).map((place) =>
    withPlaceImage({
      ...place,
      category: "Smeštaj",
      tags: [...new Set(["hotel", "prenociste", ...place.tags])],
      estimatedDurationMinutes: place.estimatedDurationMinutes ?? 720,
      estimatedCostPerPerson: place.estimatedCostPerPerson ?? 5000,
    }),
  );
}

export async function fetchOverpassByOsmId(osmId: number): Promise<Place | null> {
  const query = `
[out:json][timeout:15];
(node(${osmId});way(${osmId});relation(${osmId}););
out center tags;
`.trim();
  const elements = await overpassQuery(query);
  return placesFromOverpassElements(elements, { allowUnnamedPools: true })[0] ?? null;
}

async function loadBundledSnapshot(): Promise<Place[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "src/data/osmPlaces.json");
    const raw = await readFile(filePath, "utf8");
    return (JSON.parse(raw) as Place[]).map(withPlaceImage);
  } catch {
    return [];
  }
}

export async function fetchOverpassPlaces(): Promise<Place[]> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_MS) {
    return memoryCache.places;
  }

  const snapshot = await loadBundledSnapshot();
  if (snapshot.length > 0) {
    memoryCache = { places: snapshot, fetchedAt: Date.now() };
    return snapshot;
  }

  const elements = await overpassQuery(QUERY);
  if (elements.length === 0) {
    if (memoryCache) {
      return memoryCache.places;
    }
    throw new Error("OVERPASS_FAILED");
  }

  const result = placesFromOverpassElements(elements);
  memoryCache = { places: result, fetchedAt: Date.now() };
  return result;
}
