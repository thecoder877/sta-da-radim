import type { Place } from "@/types/place";

const STOCK_HOSTS = ["images.unsplash.com", "source.unsplash.com"];

export function isAuthenticPlaceImage(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith("/images/")) {
    return false;
  }
  try {
    const host = trimmed.startsWith("http") ? new URL(trimmed).hostname : "";
    if (STOCK_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export function authenticImageUrl(place: Pick<Place, "imageUrl">): string | undefined {
  return isAuthenticPlaceImage(place.imageUrl) ? place.imageUrl : undefined;
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
    return isAuthenticPlaceImage(raw) ? raw : undefined;
  }
  const file = raw.replace(/^File:/i, "").trim();
  if (!file) {
    return undefined;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;
}

/** Keep only a real photo of this place. Never invent a stock cover. */
export function withPlaceImage<T extends Place>(place: T): T {
  const imageUrl = authenticImageUrl(place);
  if (imageUrl === place.imageUrl) {
    return place;
  }
  return { ...place, imageUrl };
}
