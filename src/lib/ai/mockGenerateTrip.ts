import { addDays, format, parseISO } from "date-fns";
import { SERBIA_CENTER } from "@/lib/constants";
import { calculateDistanceKm, estimateTravelMinutes } from "@/lib/geo/distance";
import {
  dailyTravelBudgetKm,
  effectiveSearchRadiusKm,
} from "@/lib/geo/travelTime";
import { resolveStartCoordinates } from "@/lib/locations";
import { slugify } from "@/lib/format";
import { withPlaceImage } from "@/lib/places/placeImage";
import {
  filterPlacesByBudget,
  filterPlacesByDistance,
} from "@/lib/tripPlanner/filtering";
import { rankPlacesForTrip } from "@/lib/tripPlanner/scoring";
import type { Coordinates, Place } from "@/types/place";
import type {
  GeneratedTrip,
  TripDay,
  TripRequest,
  TripStop,
} from "@/types/trip";

function targetStopCount(request: TripRequest): number {
  const preset = request.durationPreset;
  let base = request.days * 4;

  if (preset === "hours") {
    base = 3;
  } else if (preset === "1") {
    base = 5;
  } else if (preset === "2") {
    base = 8;
  } else if (preset === "3") {
    base = 11;
  } else if (preset === "4plus") {
    base = 13;
  }

  if (request.transport === "walk") {
    base = Math.min(base, request.days * 3);
  } else if (request.transport === "bike") {
    base = Math.min(base, request.days * 4);
  }

  if (request.travelStyle === "relaxed") {
    return Math.max(2, base - 2);
  }
  if (request.travelStyle === "packed") {
    return base + 2;
  }
  return base;
}

function trimPlacesToPathBudget(
  origin: Coordinates,
  places: Place[],
  budgetKm: number,
): Place[] {
  if (!Number.isFinite(budgetKm) || budgetKm <= 0 || places.length <= 2) {
    return places;
  }

  const kept: Place[] = [];
  let current = origin;
  let used = 0;

  for (const place of places) {
    const hop = calculateDistanceKm(current, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    if (kept.length >= 2 && used + hop > budgetKm) {
      break;
    }
    kept.push(place);
    used += hop;
    current = { latitude: place.latitude, longitude: place.longitude };
  }

  return kept.length >= 2 ? kept : places.slice(0, 2);
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

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(wrapped / 60);
  const nextMins = wrapped % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
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

  const searchRadiusKm = effectiveSearchRadiusKm(
    request.transport,
    request.maxDistanceKm,
    request.days,
  );
  let byDistance = filterPlacesByDistance(catalog, origin, searchRadiusKm);
  let expandedRadius = searchRadiusKm;
  const expandCap =
    request.transport === "walk" ? 30 : request.transport === "bike" ? 80 : 80;
  while (
    byDistance.length < 4 &&
    expandedRadius != null &&
    expandedRadius < expandCap &&
    (request.maxDistanceKm == null || expandedRadius < request.maxDistanceKm)
  ) {
    const nextRadius = Math.min(
      expandCap,
      request.maxDistanceKm ?? expandCap,
      Math.round(expandedRadius * 2),
    );
    if (nextRadius <= expandedRadius) {
      break;
    }
    expandedRadius = nextRadius;
    byDistance = filterPlacesByDistance(catalog, origin, expandedRadius);
  }
  const byBudget = filterPlacesByBudget(
    byDistance,
    request.budget,
    request.numberOfPeople,
  );
  const ranked = rankPlacesForTrip(byBudget, request, origin).filter(
    (item) => item.score > 0 || request.interests.length === 0,
  );

  const usable = (ranked.length > 0 ? ranked : rankPlacesForTrip(byDistance, request, origin))
    .map((item) => item.place)
    .filter((place) => place.category !== "Smeštaj");

  const count = Math.min(targetStopCount(request), usable.length);
  const dailyBudget = dailyTravelBudgetKm(request.transport);
  const pathBudgetKm = dailyBudget != null ? dailyBudget * request.days : undefined;
  const selected = trimPlacesToPathBudget(
    origin,
    orderByNearestNeighbor(origin, usable.slice(0, Math.max(count, 3))).slice(0, count),
    pathBudgetKm ?? Number.POSITIVE_INFINITY,
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
        place: withPlaceImage(place),
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
    description: [
      `Plan sastavljen prema polasku iz ${request.startLocation.name}, sa fokusom na ${request.interests.slice(0, 3).join(", ") || "mešovita interesovanja"}.`,
      request.transport === "walk"
        ? "Vreme hoda je računato pešačkim tempom (~4,5 km/h), ne automobilom."
        : request.transport === "bike"
          ? "Vreme na biciklu je računato ~14 km/h, ne automobilom."
          : "Procene cene i vremena su orijentacione.",
    ].join(" "),
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
