import type { Coordinates } from "@/types/place";
import type { RouteGeometry } from "@/lib/providers/types";

const FOSSGIS_OSRM = "https://routing.openstreetmap.de";
const PROJECT_OSRM = "https://router.project-osrm.org";

function fossgisProfile(profile: "driving" | "walking" | "cycling"): "car" | "foot" | "bike" {
  if (profile === "walking") {
    return "foot";
  }
  if (profile === "cycling") {
    return "bike";
  }
  return "car";
}

/**
 * FOSSGIS exposes walk/bike as /routed-foot and /routed-bike.
 * router.project-osrm.org is car-only — calling /route/v1/foot there 404s
 * and the client used to fall through to a driving duration.
 */
export function osrmRouteUrl(
  base: string,
  profile: "driving" | "walking" | "cycling",
  coords: string,
): string | null {
  const root = base.replace(/\/$/, "");
  if (root.includes("routing.openstreetmap.de")) {
    const routed = fossgisProfile(profile);
    return `${root}/routed-${routed}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  }

  if (profile !== "driving") {
    return null;
  }

  return `${root}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
}

function osrmBases(profile: "driving" | "walking" | "cycling"): string[] {
  if (profile === "driving") {
    return [PROJECT_OSRM, FOSSGIS_OSRM];
  }
  return [FOSSGIS_OSRM];
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

  for (const base of osrmBases(profile)) {
    const url = osrmRouteUrl(base, profile, coords);
    if (!url) {
      continue;
    }

    try {
      const response = await fetch(url, {
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
