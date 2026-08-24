import { fetchWithTimeout } from "@/lib/providers/http";
import type { Coordinates } from "@/types/place";
import type { RouteGeometry } from "@/lib/providers/types";

const OSRM_URLS = [
  "https://router.project-osrm.org",
  "https://routing.openstreetmap.de",
];

function profilePath(profile: "driving" | "walking" | "cycling"): string {
  if (profile === "walking") {
    return "foot";
  }
  if (profile === "cycling") {
    return "bike";
  }
  return "car";
}

export async function getOsrmRoute(
  points: Coordinates[],
  profile: "driving" | "walking" | "cycling",
): Promise<RouteGeometry | null> {
  if (points.length < 2) {
    return null;
  }

  const coords = points
    .slice(0, 25)
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");
  const path = `/route/v1/${profilePath(profile)}/${coords}?overview=full&geometries=geojson`;

  for (const base of OSRM_URLS) {
    try {
      const response = await fetchWithTimeout(`${base}${path}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        continue;
      }
      const data = (await response.json()) as {
        code?: string;
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates?: [number, number][] };
        }>;
      };
      const route = data.routes?.[0];
      const line = route?.geometry?.coordinates;
      if (data.code !== "Ok" || !route || !line?.length) {
        continue;
      }
      return {
        distanceKm: route.distance / 1000,
        durationMinutes: Math.round(route.duration / 60),
        coordinates: line.map(([longitude, latitude]) => ({ latitude, longitude })),
      };
    } catch {
      // try next server
    }
  }

  return null;
}
