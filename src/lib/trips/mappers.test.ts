import { describe, expect, it } from "vitest";
import type { TripRequest } from "@/types/trip";
import {
  mapDatabaseTripToGeneratedTrip,
  type TripDayRow,
  type TripRow,
  type TripStopRow,
} from "./mappers";

const request: TripRequest = {
  startLocation: { name: "Beograd" },
  startDate: "2026-09-01",
  days: 1,
  numberOfPeople: 2,
  transport: "car",
  interests: ["istorija"],
  travelStyle: "balanced",
  additionalPreferences: "Zovem se Ana, broj 060...",
};

function tripRow(overrides: Partial<TripRow> = {}): TripRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "owner-1",
    title: "Test",
    description: null,
    start_location_name: "Beograd",
    start_latitude: 44.78,
    start_longitude: 20.44,
    start_date: "2026-09-01",
    number_of_days: 1,
    number_of_people: 2,
    budget: null,
    transport: "car",
    max_distance_km: null,
    travel_style: "balanced",
    additional_preferences: null,
    duration_preset: null,
    interests: ["istorija"],
    estimated_total_cost: null,
    total_distance_km: null,
    total_travel_minutes: null,
    route_coordinates: null,
    request_snapshot: request,
    is_public: true,
    share_slug: "test-abc",
    created_at: "2026-08-24T00:00:00.000Z",
    ...overrides,
  };
}

const days: TripDayRow[] = [
  {
    id: "day-1",
    trip_id: "11111111-1111-4111-8111-111111111111",
    day_number: 1,
    date: "2026-09-01",
  },
];

const stops: TripStopRow[] = [
  {
    id: "stop-1",
    trip_day_id: "day-1",
    position: 0,
    place_id: null,
    external_place_id: "osm-node-1",
    name: "Kalemegdan",
    latitude: 44.82,
    longitude: 20.45,
    stop_type: "place",
    arrival_time: "09:20",
    departure_time: "10:50",
    duration_minutes: 90,
    estimated_cost: null,
    reason: "Istorija",
    metadata: { category: "Istorija", tags: ["istorija"], slug: "kalemegdan" },
  },
];

describe("mapDatabaseTripToGeneratedTrip", () => {
  it("reconstructs the itinerary graph", () => {
    const trip = mapDatabaseTripToGeneratedTrip(tripRow(), days, stops, {
      currentUserId: "owner-1",
    });
    expect(trip.daysPlan).toHaveLength(1);
    expect(trip.daysPlan[0].stops[0].place.name).toBe("Kalemegdan");
    expect(trip.stops).toHaveLength(1);
    expect(trip.isOwner).toBe(true);
  });

  it("exposes the request snapshot to the owner", () => {
    const trip = mapDatabaseTripToGeneratedTrip(tripRow(), days, stops, {
      currentUserId: "owner-1",
    });
    expect(trip.request?.additionalPreferences).toBe(request.additionalPreferences);
  });

  it("redacts the request snapshot for non-owners (public view)", () => {
    const trip = mapDatabaseTripToGeneratedTrip(tripRow(), days, stops, {
      currentUserId: null,
    });
    expect(trip.isOwner).toBe(false);
    expect(trip.request).toBeUndefined();
  });

  it("redacts the request snapshot for a different logged-in user", () => {
    const trip = mapDatabaseTripToGeneratedTrip(tripRow(), days, stops, {
      currentUserId: "someone-else",
    });
    expect(trip.isOwner).toBe(false);
    expect(trip.request).toBeUndefined();
  });
});
