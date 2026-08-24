import { addDays, format, parseISO } from "date-fns";
import { SERBIA_CENTER } from "@/lib/constants";
import { calculateDistanceKm, estimateTravelMinutes } from "@/lib/geo/distance";
import { resolveStartCoordinates } from "@/lib/locations";
import { slugify } from "@/lib/format";
import {
  MIN_STOPS,
  STOP_COUNT_BY_PRESET,
  STOPS_PER_DAY,
  TRAVEL_STYLE_STOP_DELTA,
} from "@/lib/tripPlanner/config";
import {
  filterPlacesByBudget,
  filterPlacesByDistance,
  filterPlacesByInterests,
} from "@/lib/tripPlanner/filtering";
import { rankPlacesForTrip } from "@/lib/tripPlanner/scoring";
import { addMinutesToTime } from "@/lib/tripPlanner/time";
import type { Coordinates, Place } from "@/types/place";
import type {
  GeneratedTrip,
  TripDay,
  TripRequest,
  TripStop,
} from "@/types/trip";

function targetStopCount(request: TripRequest): number {
  const base = request.durationPreset
    ? STOP_COUNT_BY_PRESET[request.durationPreset]
    : request.days * STOPS_PER_DAY;

  const target = base + TRAVEL_STYLE_STOP_DELTA[request.travelStyle];
  return request.travelStyle === "relaxed" ? Math.max(MIN_STOPS, target) : target;
}

function orderByNearestNeighbor(
  origin: Coordinates,
  places: Place[],
): Place[] {
  const remaining = [...places];
  const ordered: Place[] = [];
  let current = origin;

  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const da = calculateDistanceKm(current, {
        latitude: a.latitude,
        longitude: a.longitude,
      });
      const db = calculateDistanceKm(current, {
        latitude: b.latitude,
        longitude: b.longitude,
      });
      return da - db;
    });

    const next = remaining.shift();
    if (!next) {
      break;
    }
    ordered.push(next);
    current = { latitude: next.latitude, longitude: next.longitude };
  }

  return ordered;
}

function buildTitle(places: Place[], startLocation: string): string {
  const regions = [...new Set(places.map((place) => place.city ?? place.region).filter(Boolean))];
  if (regions.length >= 2) {
    return `${regions[0]} & ${regions[1]}`;
  }
  if (regions[0]) {
    return `${regions[0]} iz ${startLocation}`;
  }
  return `Izlet iz ${startLocation}`;
}

function buildReason(place: Place, request: TripRequest): string {
  const matched = place.tags.filter((tag) =>
    request.interests.includes(tag),
  );
  if (place.category === "Hrana") {
    return "Pauza za ručak i lokalnu hranu, da dan ne bude samo u hodu.";
  }
  if (matched.includes("vidikovci")) {
    return "Jak vidik i kratka šetnja — lako se uklapa u ritam dana.";
  }
  if (matched.includes("manastiri") || place.category === "Istorija") {
    return "Daje danu kontekst i predah, bez predugog zadržavanja.";
  }
  if (matched.includes("priroda") || place.category === "Priroda") {
    return "Prirodna stanica blizu rute, sa dovoljno prostora za šetnju.";
  }
  return place.shortDescription;
}

export function generateMockTrip(
  request: TripRequest,
  catalog: Place[],
): GeneratedTrip {
  const origin =
    request.startLocation.coordinates ??
    resolveStartCoordinates(request.startLocation.name) ??
    SERBIA_CENTER;

  const byDistance = filterPlacesByDistance(
    catalog,
    origin,
    request.maxDistanceKm,
  );
  const byBudget = filterPlacesByBudget(
    byDistance,
    request.budget,
    request.numberOfPeople,
  );

  // Interests must be a real constraint, not just a scoring hint. Keep only
  // places that match a selected interest, but fall back to the wider budget
  // pool when interests would leave too few candidates to build a plan.
  const minCandidates = Math.max(2, Math.min(targetStopCount(request), 4));
  const byInterests = filterPlacesByInterests(byBudget, request.interests);
  const interestPool = byInterests.length >= minCandidates ? byInterests : byBudget;

  const ranked = rankPlacesForTrip(interestPool, request, origin).filter(
    (item) => item.score > 0 || request.interests.length === 0,
  );

  const usable = (ranked.length > 0 ? ranked : rankPlacesForTrip(byDistance, request, origin))
    .map((item) => item.place)
    .filter((place) => place.category !== "Smeštaj");

  const count = Math.min(targetStopCount(request), usable.length);
  const selected = orderByNearestNeighbor(origin, usable.slice(0, Math.max(count, 3))).slice(
    0,
    count,
  );

  if (selected.length < 2) {
    throw new Error("NOT_ENOUGH_PLACES");
  }

  const startDate = request.startDate;
  const days = request.days;
  const perDay = Math.ceil(selected.length / days);
  const daysPlan: TripDay[] = [];
  const allStops: TripStop[] = [];

  let previous: Coordinates = origin;
  let totalDistance = 0;
  let totalTravel = 0;
  let totalCost = 0;

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const slice = selected.slice(dayIndex * perDay, (dayIndex + 1) * perDay);
    if (slice.length === 0) {
      continue;
    }

    const date = format(addDays(parseISO(startDate), dayIndex), "yyyy-MM-dd");
    let cursor = dayIndex === 0 && request.durationPreset === "hours" ? "10:00" : "09:00";
    const dayStops: TripStop[] = [];

    if (dayIndex === 0) {
      const firstLeg = calculateDistanceKm(origin, {
        latitude: slice[0].latitude,
        longitude: slice[0].longitude,
      });
      const firstTravel = estimateTravelMinutes(firstLeg, request.transport);
      cursor = addMinutesToTime(cursor, Math.max(firstTravel, 20));
    }

    for (const place of slice) {
      const hop = calculateDistanceKm(previous, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      const travel = estimateTravelMinutes(hop, request.transport);
      totalDistance += hop;
      totalTravel += travel;

      const duration =
        place.estimatedDurationMinutes ??
        (request.travelStyle === "relaxed" ? 90 : 60);
      const cost =
        (place.estimatedCostPerPerson ?? 0) * request.numberOfPeople;
      totalCost += cost;

      const stop: TripStop = {
        id: `stop-${place.id}-${dayIndex}`,
        placeId: place.id,
        place,
        arrivalTime: cursor,
        departureTime: addMinutesToTime(cursor, duration),
        durationMinutes: duration,
        reason: buildReason(place, request),
        estimatedCost: cost || undefined,
        kind: "visit",
      };

      dayStops.push(stop);
      allStops.push(stop);
      previous = { latitude: place.latitude, longitude: place.longitude };
      cursor = addMinutesToTime(stop.departureTime ?? cursor, Math.max(travel, 15));
    }

    daysPlan.push({
      dayNumber: dayIndex + 1,
      date,
      stops: dayStops,
    });
  }

  const title = buildTitle(selected, request.startLocation.name);
  const suffix = Math.random().toString(36).slice(2, 7);

  return {
    id: `${slugify(title)}-${suffix}`,
    title,
    description: `Plan sastavljen prema polasku iz ${request.startLocation.name}, sa fokusom na ${request.interests.slice(0, 3).join(", ") || "mešovita interesovanja"}. Procene cene i vremena su orijentacione.`,
    startLocation: request.startLocation.name,
    startDate,
    days,
    transport: request.transport,
    totalDistanceKm: Number(totalDistance.toFixed(1)),
    totalTravelMinutes: totalTravel,
    estimatedTotalCost: Math.round(totalCost) || undefined,
    stops: allStops,
    daysPlan,
    startCoordinates: origin,
    createdAt: new Date().toISOString(),
    shareSlug: `${slugify(title)}-${suffix}`,
    isPublic: false,
  };
}
