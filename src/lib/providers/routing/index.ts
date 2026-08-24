import { calculateDistanceKm, estimateTravelMinutes } from "@/lib/geo/distance";
import { sanitizeTravelMinutes } from "@/lib/geo/travelTime";
import { getGoogleRoute } from "@/lib/providers/routing/google";
import { getOsrmRoute } from "@/lib/providers/routing/osrm";
import type { RouteGeometry, RoutingProvider } from "@/lib/providers/types";
import type { Coordinates } from "@/types/place";
import type { TransportType } from "@/types/trip";

const MAX_POINTS_PER_REQUEST = 10;

export function routingProfile(
  transport: TransportType,
): "driving" | "walking" | "cycling" {
  if (transport === "walk") {
    return "walking";
  }
  if (transport === "bike") {
    return "cycling";
  }
  return "driving";
}

async function fetchRouteGeometry(
  points: Coordinates[],
  transport: TransportType,
): Promise<RouteGeometry | null> {
  const profile = routingProfile(transport);
  try {
    const google = await getGoogleRoute(points, profile);
    if (google && google.coordinates.length > 1) {
      return google;
    }
  } catch {
    // official Google Directions is optional; OSRM still draws a road path
  }

  return getOsrmRoute(points, profile);
}

function withSanitizedDuration(
  route: RouteGeometry,
  transport: TransportType,
): RouteGeometry {
  return {
    ...route,
    durationMinutes: sanitizeTravelMinutes(
      route.distanceKm,
      route.durationMinutes,
      transport,
    ),
  };
}

function estimateStraightRoute(
  points: Coordinates[],
  transport: TransportType,
): RouteGeometry {
  let distanceKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    distanceKm += calculateDistanceKm(points[index - 1], points[index]);
  }
  const roadKm = distanceKm * 1.25;
  return {
    distanceKm: roadKm,
    durationMinutes: estimateTravelMinutes(roadKm, transport),
    coordinates: points,
  };
}

function mergeRoutes(parts: RouteGeometry[]): RouteGeometry {
  const coordinates: Coordinates[] = [];
  let distanceKm = 0;
  let durationMinutes = 0;
  for (const part of parts) {
    distanceKm += part.distanceKm;
    durationMinutes += part.durationMinutes;
    const offset = coordinates.length > 0 ? 1 : 0;
    coordinates.push(...part.coordinates.slice(offset));
  }
  return { distanceKm, durationMinutes, coordinates };
}

function chunksOf(points: Coordinates[]): Coordinates[][] {
  const chunks: Coordinates[][] = [];
  let start = 0;
  while (start < points.length - 1) {
    const end = Math.min(start + MAX_POINTS_PER_REQUEST - 1, points.length - 1);
    chunks.push(points.slice(start, end + 1));
    start = end;
  }
  return chunks;
}

export async function getTripRoute(
  points: Coordinates[],
  transport: TransportType,
): Promise<RouteGeometry | null> {
  if (points.length < 2) {
    return null;
  }

  const parts: RouteGeometry[] = [];
  for (const chunk of chunksOf(points)) {
    const routed = await fetchRouteGeometry(chunk, transport);
    if (routed) {
      parts.push(withSanitizedDuration(routed, transport));
      continue;
    }
    if (transport === "walk" || transport === "bike") {
      const driving = await fetchRouteGeometry(chunk, "car");
      if (driving) {
        parts.push(withSanitizedDuration(driving, transport));
        continue;
      }
    }
    parts.push(estimateStraightRoute(chunk, transport));
  }

  return parts.length > 0 ? mergeRoutes(parts) : null;
}

export const routingProvider: RoutingProvider = {
  getRoute(points, profile) {
    return getOsrmRoute(points, profile);
  },
};
