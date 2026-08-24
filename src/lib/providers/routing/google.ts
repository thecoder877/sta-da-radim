import type { Coordinates } from "@/types/place";
import type { RouteGeometry } from "@/lib/providers/types";

function googleMapsKey(): string | undefined {
  // Server-only key. Never fall back to the NEXT_PUBLIC_ key here: doing so
  // would turn this server route into an unauthenticated billing vector for
  // whoever can read the public bundle.
  return process.env.GOOGLE_MAPS_API_KEY;
}

function toLatLng(point: Coordinates): string {
  return `${point.latitude},${point.longitude}`;
}

function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export async function getGoogleRoute(
  points: Coordinates[],
  profile: "driving" | "walking" | "cycling",
): Promise<RouteGeometry | null> {
  const key = googleMapsKey();
  if (!key || points.length < 2) {
    return null;
  }

  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1).slice(0, 23);
  const mode = profile === "walking" ? "walking" : profile === "cycling" ? "bicycling" : "driving";
  const params = new URLSearchParams({
    origin: toLatLng(origin),
    destination: toLatLng(destination),
    mode,
    key,
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.map(toLatLng).join("|"));
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    status?: string;
    routes?: Array<{
      overview_polyline?: { points?: string };
      legs?: Array<{ distance?: { value?: number }; duration?: { value?: number } }>;
    }>;
  };

  const route = data.routes?.[0];
  const encoded = route?.overview_polyline?.points;
  if (data.status !== "OK" || !encoded) {
    return null;
  }

  const distanceMeters = (route?.legs ?? []).reduce(
    (sum, leg) => sum + (leg.distance?.value ?? 0),
    0,
  );
  const durationSeconds = (route?.legs ?? []).reduce(
    (sum, leg) => sum + (leg.duration?.value ?? 0),
    0,
  );

  return {
    distanceKm: distanceMeters / 1000,
    durationMinutes: Math.round(durationSeconds / 60),
    coordinates: decodePolyline(encoded),
  };
}
