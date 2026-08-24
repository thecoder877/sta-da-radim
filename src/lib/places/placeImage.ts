import type { Place } from "@/types/place";

const STOCK_HOSTS = ["images.unsplash.com", "source.unsplash.com"];

const COVERS = {
  priroda: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
  ],
  istorija: [
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
  ],
  smestaj: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  ],
  hrana: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  ],
  wellness: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
  ],
  avantura: [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80",
  ],
  grad: [
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
  ],
} as const;

function hashString(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10_000;
  }
  return hash;
}

function coverGroup(place: Pick<Place, "category" | "tags">): readonly string[] {
  const category = place.category.toLowerCase();
  const tags = place.tags.map((tag) => tag.toLowerCase()).join(" ");
  if (category.includes("smeštaj") || category.includes("smestaj") || tags.includes("hotel")) {
    return COVERS.smestaj;
  }
  if (category.includes("hrana") || tags.includes("restoran") || tags.includes("kafic")) {
    return COVERS.hrana;
  }
  if (category.includes("wellness") || tags.includes("spa")) {
    return COVERS.wellness;
  }
  if (category.includes("istor") || tags.includes("manastir") || tags.includes("muzej")) {
    return COVERS.istorija;
  }
  if (category.includes("avantura") || tags.includes("planinar")) {
    return COVERS.avantura;
  }
  if (category.includes("noć") || category.includes("noc") || tags.includes("grad")) {
    return COVERS.grad;
  }
  return COVERS.priroda;
}

export function fallbackPlaceImage(place: Pick<Place, "id" | "category" | "tags">): string {
  const group = coverGroup(place);
  return group[hashString(place.id) % group.length];
}

function hostnameOf(url: string): string {
  try {
    return url.startsWith("http") ? new URL(url).hostname : "";
  } catch {
    return "";
  }
}

/** Real Wikimedia / Google / user-upload photo — not a category stock cover. */
export function isAuthenticPlaceImage(url: string | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/images/")) {
    return false;
  }
  const host = hostnameOf(trimmed);
  if (STOCK_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
    return false;
  }
  return Boolean(trimmed);
}

/** Any URL we can actually render (stock covers included; missing /images files excluded). */
export function isDisplayablePlaceImage(url: string | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/images/")) {
    return false;
  }
  return trimmed.startsWith("http") || trimmed.startsWith("/api/");
}

export function authenticImageUrl(place: Pick<Place, "imageUrl">): string | undefined {
  return isAuthenticPlaceImage(place.imageUrl) ? place.imageUrl : undefined;
}

export function displayImageUrl(place: Pick<Place, "id" | "category" | "tags" | "imageUrl">): string {
  return isDisplayablePlaceImage(place.imageUrl) ? (place.imageUrl as string) : fallbackPlaceImage(place);
}

export function imageFromOsmTags(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) {
    return undefined;
  }
  const raw = tags.image ?? tags.wikimedia_commons;
  if (!raw) {
    return undefined;
  }
  if (/^https?:\/\//i.test(raw)) {
    return isDisplayablePlaceImage(raw) ? raw : undefined;
  }
  const file = raw.replace(/^File:/i, "").trim();
  if (!file) {
    return undefined;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;
}

/** Prefer a real photo; if none, use the same category cover as the first GitHub/Vercel deploy. */
export function withPlaceImage<T extends Place>(place: T): T {
  const imageUrl = displayImageUrl(place);
  if (imageUrl === place.imageUrl) {
    return place;
  }
  return { ...place, imageUrl };
}
