import { sanitizeTravelMinutes } from "@/lib/geo/travelTime";
import { getGoogleRoute } from "@/lib/providers/routing/google";
import { getOsrmRoute } from "@/lib/providers/routing/osrm";
import type { RouteGeometry, RoutingProvider } from "@/lib/providers/types";
import type { Coordinates } from "@/types/place";
import type { TransportType } from "@/types/trip";

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

export async function getTripRoute(
  points: Coordinates[],
  transport: TransportType,
): Promise<RouteGeometry | null> {
  const route = await fetchRouteGeometry(points, transport);
  if (route) {
    return withSanitizedDuration(route, transport);
  }

  // Keep a road line for the map if foot/bike routing is down, but never
  // keep the car clock — that is what produced "6h 30m hoda" on 350 km.
  if (transport === "walk" || transport === "bike") {
    const driving = await fetchRouteGeometry(points, "car");
    if (driving) {
      return withSanitizedDuration(driving, transport);
    }
  }

  return null;
}

export const routingProvider: RoutingProvider = {
  getRoute(points, profile) {
    return getOsrmRoute(points, profile);
  },
};
