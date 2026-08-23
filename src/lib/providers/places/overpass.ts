import { slugify } from "@/lib/format";
import type { Place, PlaceSource } from "@/types/place";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const SERBIA_BBOX = "42.23,18.81,46.19,23.01";
const CACHE_MS = 1000 * 60 * 60 * 12;

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

function mapCategory(tags: Record<string, string>): { category: string; tags: string[] } {
  const extra: string[] = [];
  if (tags.historic === "monastery" || tags.amenity === "place_of_worship") {
    extra.push("manastiri", "istorija");
    return { category: "Istorija", tags: extra };
  }
  if (tags.tourism === "museum" || tags.tourism === "gallery") {
    extra.push("muzeji", "istorija");
    return { category: "Istorija", tags: extra };
  }
  if (
    tags.historic === "castle" ||
    tags.historic === "ruins" ||
    tags.historic === "fort" ||
    tags.historic === "archaeological_site"
  ) {
    extra.push("istorija", "fotografija");
    return { category: "Istorija", tags: extra };
  }
  if (tags.tourism === "viewpoint" || tags.natural === "peak" || tags.natural === "cliff") {
    extra.push("vidikovci", "priroda", "fotografija");
    return { category: "Priroda", tags: extra };
  }
  if (tags.natural === "cave_entrance") {
    extra.push("avantura", "priroda");
    return { category: "Avantura", tags: extra };
  }
  if (tags.leisure === "nature_reserve" || tags.boundary === "protected_area") {
    extra.push("priroda", "planinarenje");
    return { category: "Priroda", tags: extra };
  }
  if (tags.tourism === "zoo" || tags.tourism === "theme_park") {
    extra.push("porodicno");
    return { category: "Porodično", tags: extra };
  }
  extra.push("priroda");
  return { category: "Priroda", tags: extra };
}

function toPlace(element: OverpassElement): Place | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim() || tags["name:sr"]?.trim() || tags["name:en"]?.trim();
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!name || latitude === undefined || longitude === undefined) {
    return null;
  }

  const mapped = mapCategory(tags);
  const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["is_in:city"];
  const region = tags["is_in"] ?? tags["addr:province"];
  const description =
    tags.description ??
    tags["description:sr"] ??
    `${name} — lokacija iz otvorene mape Srbije.`;

  return {
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
    source: "osm" as PlaceSource,
    verified: Boolean(tags.wikipedia || tags.wikidata),
    environment:
      tags.tourism === "museum" || tags.tourism === "gallery" ? "indoor" : "outdoor",
  };
}

async function loadBundledSnapshot(): Promise<Place[]> {
  try {
    const snapshot = (await import("@/data/osmPlaces.json")).default as Place[];
    return snapshot;
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

  let payload: OverpassResponse | null = null;
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "StaDaRadim/1.0 (serbia travel planner)",
        },
        body: `data=${encodeURIComponent(QUERY)}`,
        cache: "force-cache",
      });
      if (response.ok) {
        payload = (await response.json()) as OverpassResponse;
        break;
      }
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const snapshot = await loadBundledSnapshot();
    if (snapshot.length > 0) {
      memoryCache = { places: snapshot, fetchedAt: Date.now() };
      return snapshot;
    }
    if (memoryCache) {
      return memoryCache.places;
    }
    throw new Error("OVERPASS_FAILED");
  }
  const places = (payload.elements ?? [])
    .map(toPlace)
    .filter((place): place is Place => place !== null);

  const unique = new Map<string, Place>();
  for (const place of places) {
    const key = `${place.name.toLowerCase()}|${place.latitude.toFixed(3)}|${place.longitude.toFixed(3)}`;
    if (!unique.has(key)) {
      unique.set(key, place);
    }
  }

  const result = [...unique.values()];
  memoryCache = { places: result, fetchedAt: Date.now() };
  return result;
}
