import { findLodgingNearby } from "@/lib/providers/lodging";
import { getTripRoute } from "@/lib/providers/routing";
import type { Coordinates } from "@/types/place";
import type { GeneratedTrip, TripRequest, TripStop } from "@/types/trip";

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(wrapped / 60);
  const nextMins = wrapped % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

function lastVisitStop(stops: TripStop[]): TripStop | undefined {
  return [...stops].reverse().find((stop) => stop.kind !== "lodging");
}

export async function insertLodgingStops(
  trip: GeneratedTrip,
  request: TripRequest,
): Promise<GeneratedTrip> {
  if (trip.days < 2) {
    return trip;
  }

  const usedIds = new Set<string>();
  let extraCost = 0;

  for (let index = 0; index < trip.daysPlan.length - 1; index += 1) {
    const day = trip.daysPlan[index];
    if (day.stops.some((stop) => stop.kind === "lodging")) {
      continue;
    }
    const last = lastVisitStop(day.stops);
    if (!last) {
      continue;
    }

    const lodging = await Promise.race([
      findLodgingNearby(
        { latitude: last.place.latitude, longitude: last.place.longitude },
        usedIds,
      ),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 8000);
      }),
    ]);
    if (!lodging) {
      continue;
    }

    usedIds.add(lodging.id);
    const cost = (lodging.estimatedCostPerPerson ?? 5000) * request.numberOfPeople;
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
  }

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
