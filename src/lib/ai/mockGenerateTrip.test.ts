import { describe, expect, it } from "vitest";
import type { Place } from "@/types/place";
import type { TripRequest } from "@/types/trip";
import { generateMockTrip } from "./mockGenerateTrip";

const origin = { latitude: 44.7866, longitude: 20.4489 };

function place(id: string, category: string, tags: string[], offset = 0): Place {
  return {
    id,
    name: id,
    slug: id,
    shortDescription: `${id} desc`,
    latitude: 44.79 + offset * 0.01,
    longitude: 20.45 + offset * 0.01,
    category,
    tags,
    source: "osm",
    verified: true,
    estimatedDurationMinutes: 90,
  };
}

function request(overrides: Partial<TripRequest> = {}): TripRequest {
  return {
    startLocation: { name: "Beograd", coordinates: origin },
    startDate: "2026-09-01",
    days: 1,
    durationPreset: "1",
    numberOfPeople: 2,
    transport: "car",
    maxDistanceKm: 100,
    interests: ["istorija"],
    travelStyle: "balanced",
    ...overrides,
  };
}

describe("generateMockTrip", () => {
  it("constrains selection to places matching the chosen interests", () => {
    const catalog = [
      place("h1", "Istorija", ["istorija"], 1),
      place("h2", "Istorija", ["muzeji"], 2),
      place("h3", "Istorija", ["istorija"], 3),
      place("h4", "Istorija", ["istorija"], 4),
      place("n1", "Priroda", ["priroda"], 5),
      place("n2", "Priroda", ["priroda"], 6),
      place("n3", "Priroda", ["priroda"], 7),
    ];
    const trip = generateMockTrip(request({ interests: ["istorija", "muzeji"] }), catalog);
    const categories = new Set(trip.stops.map((stop) => stop.place.category));
    expect(categories.has("Priroda")).toBe(false);
    expect(categories.has("Istorija")).toBe(true);
  });

  it("falls back to the wider pool when too few places match the interests", () => {
    const catalog = [
      place("n1", "Priroda", ["priroda"], 1),
      place("n2", "Priroda", ["priroda"], 2),
      place("n3", "Priroda", ["priroda"], 3),
      place("n4", "Priroda", ["priroda"], 4),
    ];
    // "vino" matches nothing; planner should still build a plan.
    const trip = generateMockTrip(request({ interests: ["vino"] }), catalog);
    expect(trip.stops.length).toBeGreaterThanOrEqual(2);
  });

  it("throws NOT_ENOUGH_PLACES when fewer than two usable places exist", () => {
    expect(() =>
      generateMockTrip(request(), [place("only", "Istorija", ["istorija"], 1)]),
    ).toThrow("NOT_ENOUGH_PLACES");
  });
});
