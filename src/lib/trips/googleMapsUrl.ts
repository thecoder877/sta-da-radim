import { resolveStartCoordinates } from "@/lib/locations";
import { drivingWaypoints } from "@/lib/trips/routeWaypoints";
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

function dirFlag(transport: TransportType): string {
  if (transport === "walk") {
    return "3e2";
  }
  if (transport === "bike") {
    return "3e1";
  }
  if (transport === "bus" || transport === "train") {
    return "3e3";
  }
  return "3e0";
}

function point(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function googleMapsDirectionsUrl(trip: GeneratedTrip): string | null {
  const start =
    trip.startCoordinates ?? resolveStartCoordinates(trip.startLocation);
  if (!start) {
    return null;
  }

  const points = drivingWaypoints(trip, start);
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${point(points[0].latitude, points[0].longitude)}`;
  }
  if (points.length < 2) {
    return null;
  }

  // Path form keeps every visit. The api=1 waypoint list is capped at 9
  // intermediates, which made Maps look like a 365 km trip while the app
  // still counted every hotel detour.
  const path = points.map((item) => point(item.latitude, item.longitude)).join("/");
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!${dirFlag(trip.transport)}`;
}

export function googleMapsTravelMode(trip: GeneratedTrip): string {
  return travelMode(trip.transport);
}
