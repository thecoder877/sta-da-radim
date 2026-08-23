import type { Place } from "@/types/place";
import type {
  GeneratedTrip,
  SavedTripSummary,
  TripDay,
  TripRequest,
  TripStop,
  TripStopKind,
} from "@/types/trip";

export interface TripRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_location_name: string;
  start_latitude: number | null;
  start_longitude: number | null;
  start_date: string;
  number_of_days: number;
  number_of_people: number;
  budget: number | null;
  transport: GeneratedTrip["transport"];
  max_distance_km: number | null;
  travel_style: TripRequest["travelStyle"];
  additional_preferences: string | null;
  duration_preset: TripRequest["durationPreset"] | null;
  interests: string[] | null;
  estimated_total_cost: number | null;
  total_distance_km: number | null;
  total_travel_minutes: number | null;
  route_coordinates: GeneratedTrip["routeCoordinates"] | null;
  request_snapshot: TripRequest | null;
  is_public: boolean;
  share_slug: string | null;
  created_at: string;
}

export interface TripDayRow {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
}

export interface TripStopRow {
  id: string;
  trip_day_id: string;
  position: number;
  place_id: string | null;
  external_place_id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  stop_type: string;
  arrival_time: string | null;
  departure_time: string | null;
  duration_minutes: number | null;
  estimated_cost: number | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
}

function stopTypeFromKind(kind?: TripStopKind): string {
  if (kind === "lodging") {
    return "hotel";
  }
  if (kind === "start") {
    return "origin";
  }
  return "place";
}

function kindFromStopType(stopType: string): TripStopKind {
  if (stopType === "hotel") {
    return "lodging";
  }
  if (stopType === "origin") {
    return "start";
  }
  return "visit";
}

function placeFromStop(stop: TripStopRow): Place {
  const metadata = stop.metadata ?? {};
  return {
    id: stop.external_place_id ?? stop.place_id ?? stop.id,
    name: stop.name,
    slug: typeof metadata.slug === "string" ? metadata.slug : stop.id,
    shortDescription:
      typeof metadata.shortDescription === "string"
        ? metadata.shortDescription
        : stop.reason ?? stop.name,
    description: typeof metadata.description === "string" ? metadata.description : undefined,
    latitude: stop.latitude,
    longitude: stop.longitude,
    city: typeof metadata.city === "string" ? metadata.city : undefined,
    region: typeof metadata.region === "string" ? metadata.region : undefined,
    category: typeof metadata.category === "string" ? metadata.category : "Srbija",
    tags: Array.isArray(metadata.tags) ? metadata.tags.filter((tag): tag is string => typeof tag === "string") : [],
    website: typeof metadata.website === "string" ? metadata.website : undefined,
    imageUrl: typeof metadata.imageUrl === "string" ? metadata.imageUrl : undefined,
    source:
      metadata.source === "osm" ||
      metadata.source === "google" ||
      metadata.source === "internal" ||
      metadata.source === "community" ||
      metadata.source === "mapbox"
        ? metadata.source
        : "internal",
    verified: Boolean(metadata.verified),
  };
}

export function mapGeneratedTripToDatabaseInput(trip: GeneratedTrip) {
  const request = trip.request;
  return {
    title: trip.title,
    description: trip.description ?? null,
    start_location_name: trip.startLocation,
    start_latitude: trip.startCoordinates?.latitude ?? null,
    start_longitude: trip.startCoordinates?.longitude ?? null,
    start_date: trip.startDate,
    number_of_days: trip.days,
    number_of_people: request?.numberOfPeople ?? 2,
    budget: request?.budget ?? null,
    transport: trip.transport,
    max_distance_km: request?.maxDistanceKm ?? null,
    travel_style: request?.travelStyle ?? "balanced",
    additional_preferences: request?.additionalPreferences ?? null,
    duration_preset: request?.durationPreset ?? null,
    interests: request?.interests ?? [],
    estimated_total_cost: trip.estimatedTotalCost ?? null,
    total_distance_km: trip.totalDistanceKm ?? null,
    total_travel_minutes: trip.totalTravelMinutes ?? null,
    route_coordinates: trip.routeCoordinates ?? null,
    request_snapshot: request ?? null,
  };
}

export function mapStopToDatabaseInput(stop: TripStop, position: number) {
  return {
    position,
    place_id: null,
    external_place_id: stop.placeId,
    name: stop.place.name,
    latitude: stop.place.latitude,
    longitude: stop.place.longitude,
    stop_type: stopTypeFromKind(stop.kind),
    arrival_time: stop.arrivalTime,
    departure_time: stop.departureTime ?? null,
    duration_minutes: stop.durationMinutes,
    estimated_cost: stop.estimatedCost ?? null,
    reason: stop.reason ?? null,
    metadata: {
      slug: stop.place.slug,
      category: stop.place.category,
      tags: stop.place.tags,
      shortDescription: stop.place.shortDescription,
      description: stop.place.description,
      city: stop.place.city,
      region: stop.place.region,
      website: stop.place.website,
      imageUrl: stop.place.imageUrl,
      source: stop.place.source,
      verified: stop.place.verified,
    },
  };
}

export function mapDatabaseTripToGeneratedTrip(
  trip: TripRow,
  days: TripDayRow[],
  stops: TripStopRow[],
  options?: { currentUserId?: string | null },
): GeneratedTrip {
  const stopsByDay = new Map<string, TripStopRow[]>();
  for (const stop of stops) {
    const list = stopsByDay.get(stop.trip_day_id) ?? [];
    list.push(stop);
    stopsByDay.set(stop.trip_day_id, list);
  }

  const daysPlan: TripDay[] = [...days]
    .sort((a, b) => a.day_number - b.day_number)
    .map((day) => {
      const dayStops = (stopsByDay.get(day.id) ?? []).sort((a, b) => a.position - b.position);
      return {
        dayNumber: day.day_number,
        date: day.date,
        stops: dayStops.map((stop) => ({
          id: stop.id,
          placeId: stop.external_place_id ?? stop.id,
          place: placeFromStop(stop),
          arrivalTime: stop.arrival_time ?? "09:00",
          departureTime: stop.departure_time ?? undefined,
          durationMinutes: stop.duration_minutes ?? 60,
          reason: stop.reason ?? undefined,
          estimatedCost: stop.estimated_cost ?? undefined,
          kind: kindFromStopType(stop.stop_type),
        })),
      };
    });

  const allStops = daysPlan.flatMap((day) => day.stops);

  return {
    id: trip.id,
    title: trip.title,
    description: trip.description ?? undefined,
    startLocation: trip.start_location_name,
    startDate: trip.start_date,
    days: trip.number_of_days,
    transport: trip.transport,
    totalDistanceKm: trip.total_distance_km ?? undefined,
    totalTravelMinutes: trip.total_travel_minutes ?? undefined,
    estimatedTotalCost: trip.estimated_total_cost ?? undefined,
    stops: allStops,
    daysPlan,
    startCoordinates:
      trip.start_latitude !== null && trip.start_longitude !== null
        ? { latitude: trip.start_latitude, longitude: trip.start_longitude }
        : undefined,
    routeCoordinates: trip.route_coordinates ?? undefined,
    createdAt: trip.created_at,
    shareSlug: trip.share_slug ?? undefined,
    isPublic: trip.is_public,
    request: trip.request_snapshot ?? undefined,
    persisted: true,
    isOwner: Boolean(options?.currentUserId && options.currentUserId === trip.user_id),
  };
}

export function mapTripRowToSummary(trip: TripRow): SavedTripSummary {
  return {
    id: trip.id,
    title: trip.title,
    startLocation: trip.start_location_name,
    startDate: trip.start_date,
    days: trip.number_of_days,
    totalDistanceKm: trip.total_distance_km ?? undefined,
    estimatedTotalCost: trip.estimated_total_cost ?? undefined,
    isPublic: trip.is_public,
    shareSlug: trip.share_slug ?? undefined,
    createdAt: trip.created_at,
  };
}
