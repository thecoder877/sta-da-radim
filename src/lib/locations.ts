import type { Coordinates } from "@/types/place";
import { START_CITIES } from "./constants.ts";

export function resolveStartCoordinates(
  name: string,
): Coordinates | undefined {
  const normalized = name.trim().toLowerCase();
  const exact = START_CITIES.find((city) => city.name.toLowerCase() === normalized);
  if (exact) {
    return { latitude: exact.latitude, longitude: exact.longitude };
  }

  const partial = START_CITIES.find(
    (city) =>
      city.name.toLowerCase().startsWith(normalized) ||
      normalized.startsWith(city.name.toLowerCase()),
  );

  if (partial) {
    return { latitude: partial.latitude, longitude: partial.longitude };
  }

  return undefined;
}

export function suggestStartCities(query: string, limit = 6) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return START_CITIES.slice(0, limit);
  }

  return START_CITIES.filter((city) =>
    city.name.toLowerCase().includes(normalized),
  ).slice(0, limit);
}
