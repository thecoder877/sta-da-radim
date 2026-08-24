import { describe, expect, it } from "vitest";
import type { Place } from "@/types/place";
import type { TripRequest } from "@/types/trip";
import { calculatePlaceScore, rankPlacesForTrip } from "./scoring";

function place(overrides: Partial<Place> & Pick<Place, "id">): Place {
  return {
    name: overrides.id,
    slug: overrides.id,
    shortDescription: "",
    latitude: 44.79,
    longitude: 20.45,
    category: "Priroda",
    tags: [],
    source: "osm",
    verified: false,
    ...overrides,
  };
}

function request(overrides: Partial<TripRequest> = {}): TripRequest {
  return {
    startLocation: { name: "Beograd" },
    startDate: "2026-09-01",
    days: 1,
    numberOfPeople: 2,
    transport: "car",
    interests: ["istorija"],
    travelStyle: "balanced",
    ...overrides,
  };
}

const origin = { latitude: 44.7866, longitude: 20.4489 };

describe("calculatePlaceScore", () => {
  it("rewards interest matches on tags and category", () => {
    const matching = place({ id: "m", category: "Istorija", tags: ["istorija"] });
    const other = place({ id: "o", category: "Priroda", tags: ["priroda"] });
    expect(calculatePlaceScore(matching, request(), origin)).toBeGreaterThan(
      calculatePlaceScore(other, request(), origin),
    );
  });

  it("rewards closer places", () => {
    const near = place({ id: "near", latitude: 44.79, longitude: 20.45 });
    const far = place({ id: "far", latitude: 45.6, longitude: 19.2 });
    expect(calculatePlaceScore(near, request(), origin)).toBeGreaterThan(
      calculatePlaceScore(far, request(), origin),
    );
  });
});

describe("rankPlacesForTrip", () => {
  it("orders by descending score", () => {
    const good = place({ id: "good", category: "Istorija", tags: ["istorija"], verified: true });
    const weak = place({ id: "weak", category: "Priroda", tags: [], latitude: 45.9, longitude: 19.1 });
    const ranked = rankPlacesForTrip([weak, good], request(), origin);
    expect(ranked[0].place.id).toBe("good");
  });
});
