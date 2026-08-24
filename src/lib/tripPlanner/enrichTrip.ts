import { findLodgingNearby, pickFallbackLodging } from "@/lib/providers/lodging";
import { getTripRoute } from "@/lib/providers/routing";
import { addMinutesToTime } from "@/lib/tripPlanner/time";
import type { Coordinates } from "@/types/place";
import type { GeneratedTrip, TripRequest, TripStop } from "@/types/trip";

function lastVisitStop(stops: TripStop[]): TripStop | undefined {
  return [...stops].reverse().find((stop) => stop.kind !== "lodging");
}

const LODGING_LOOKUP_TIMEOUT_MS = 6000;
const DEFAULT_LODGING_COST_PER_PERSON = 5000;

export async function insertLodgingStops(
  trip: GeneratedTrip,
  request: TripRequest,
): Promise<GeneratedTrip> {
  if (trip.days < 2) {
    return trip;
  }

  const nightCount = Math.max(0, trip.days - 1);
  const nights: { day: (typeof trip.daysPlan)[number]; last: TripStop }[] = [];
  for (let index = 0; index < nightCount; index += 1) {
    const day = trip.daysPlan[Math.min(index, trip.daysPlan.length - 1)];
    if (day.stops.some((stop) => stop.kind === "lodging")) {
      continue;
    }
    const last = lastVisitStop(day.stops);
    if (last) {
      nights.push({ day, last });
    }
  }

  if (nights.length === 0) {
    return trip;
  }

  // Fetch each night's lodging concurrently. Dedup is resolved afterwards so
  // the parallel calls do not need to share a used-id set.
  const candidates = await Promise.all(
    nights.map(({ last }) =>
      Promise.race([
        findLodgingNearby(
          { latitude: last.place.latitude, longitude: last.place.longitude },
          new Set<string>(),
        ),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), LODGING_LOOKUP_TIMEOUT_MS);
        }),
      ]),
    ),
  );

  const usedIds = new Set<string>();
  let extraCost = 0;

  nights.forEach(({ day, last }, index) => {
    const near = { latitude: last.place.latitude, longitude: last.place.longitude };
    let lodging = candidates[index];
    if (!lodging || usedIds.has(lodging.id)) {
      lodging = pickFallbackLodging(near, usedIds);
    }
    if (!lodging) {
      return;
    }

    usedIds.add(lodging.id);
    const cost =
      (lodging.estimatedCostPerPerson ?? DEFAULT_LODGING_COST_PER_PERSON) *
      request.numberOfPeople;
    extraCost += cost;
    const arrival = last.departureTime
      ? addMinutesToTime(last.departureTime, 30)
      : "19:30";

    const stop: TripStop = {
      id: `lodging-${lodging.id}-${day.dayNumber}`,
      placeId: lodging.id,
      place: lodging,
      arrivalTime: arrival < "18:00" ? "19:30" : arrival,
      durationMinutes: 720,
      reason: `Noćenje posle ${day.dayNumber}. dana, blizu ${last.place.city ?? last.place.name}, da sutra ne krećeš izdaleka.`,
      estimatedCost: cost,
      kind: "lodging",
    };

    day.stops.push(stop);
    trip.stops.push(stop);
  });

  if (extraCost > 0) {
    trip.estimatedTotalCost = Math.round((trip.estimatedTotalCost ?? 0) + extraCost);
  }

  return trip;
}

export async function attachTripRoute(
  trip: GeneratedTrip,
  origin: Coordinates,
  transport: TripRequest["transport"],
): Promise<GeneratedTrip> {
  trip.startCoordinates = origin;

  const waypoints: Coordinates[] = [origin];
  for (const day of trip.daysPlan) {
    for (const stop of day.stops) {
      waypoints.push({
        latitude: stop.place.latitude,
        longitude: stop.place.longitude,
      });
    }
  }

  const route = await getTripRoute(waypoints, transport);
  if (route) {
    trip.routeCoordinates = route.coordinates;
    trip.totalDistanceKm = Number(route.distanceKm.toFixed(1));
    trip.totalTravelMinutes = route.durationMinutes;
  } else {
    trip.routeCoordinates = waypoints;
  }

  return trip;
}
