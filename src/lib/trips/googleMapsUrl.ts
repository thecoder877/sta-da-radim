import { resolveStartCoordinates } from "@/lib/locations";
import type { GeneratedTrip, TransportType } from "@/types/trip";

function travelMode(transport: TransportType): string {
  if (transport === "walk") {
    return "walking";
  }
  if (transport === "bike") {
    return "bicycling";
  }
  if (transport === "bus" || transport === "train") {
    return "transit";
  }
  return "driving";
}

function point(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function googleMapsDirectionsUrl(trip: GeneratedTrip): string | null {
  const start =
    trip.startCoordinates ?? resolveStartCoordinates(trip.startLocation);
  const stops = trip.stops
    .filter((stop) => stop.kind !== "lodging")
    .map((stop) => ({
      latitude: stop.place.latitude,
      longitude: stop.place.longitude,
    }))
    .filter((coords) => Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude));

  const points = [
    ...(start ? [start] : []),
    ...stops,
  ];

  if (points.length < 2) {
    if (points.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${point(points[0].latitude, points[0].longitude)}`;
    }
    return null;
  }

  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1).slice(0, 9);
  const params = new URLSearchParams({
    api: "1",
    origin: point(origin.latitude, origin.longitude),
    destination: point(destination.latitude, destination.longitude),
    travelmode: travelMode(trip.transport),
  });
  if (waypoints.length) {
    params.set("waypoints", waypoints.map((item) => point(item.latitude, item.longitude)).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
