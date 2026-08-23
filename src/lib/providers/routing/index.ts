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

export async function getTripRoute(
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

export const routingProvider: RoutingProvider = {
  getRoute(points, profile) {
    return getOsrmRoute(points, profile);
  },
};
