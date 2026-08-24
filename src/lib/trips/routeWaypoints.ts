import type { Coordinates } from "@/types/place";
import type { GeneratedTrip, TripStop } from "@/types/trip";

function stopCoordinates(stop: TripStop): Coordinates {
  return {
    latitude: stop.place.latitude,
    longitude: stop.place.longitude,
  };
}

function roughlySame(left: Coordinates, right: Coordinates): boolean {
  return (
    Math.abs(left.latitude - right.latitude) < 0.00015 &&
    Math.abs(left.longitude - right.longitude) < 0.00015
  );
}

/**
 * Driving path used for totals and Google Maps: start + visit stops.
 * Overnight stays are local to the last visit of the day, not extra legs
 * across the country (that is what produced 1000 km vs 365 km in Maps).
 */
export function drivingWaypoints(
  trip: Pick<GeneratedTrip, "daysPlan" | "stops" | "startCoordinates">,
  origin: Coordinates,
): Coordinates[] {
  const points: Coordinates[] = [origin];
  const ordered =
    trip.daysPlan.length > 0
      ? trip.daysPlan.flatMap((day) => day.stops)
      : trip.stops;

  for (const stop of ordered) {
    if (stop.kind === "lodging") {
      continue;
    }
    const next = stopCoordinates(stop);
    const previous = points[points.length - 1];
    if (previous && roughlySame(previous, next)) {
      continue;
    }
    points.push(next);
  }

  return points;
}
