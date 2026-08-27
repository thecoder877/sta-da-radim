import { describe, expect, it } from "vitest";
import type { Place } from "@/types/place";
import {
  filterPlacesByBudget,
  filterPlacesByDistance,
  filterPlacesByInterests,
} from "./filtering";

function place(overrides: Partial<Place> & Pick<Place, "id">): Place {
  return {
    name: overrides.id,
    slug: overrides.id,
    shortDescription: "",
    latitude: 44.8,
    longitude: 20.45,
    category: "Priroda",
    tags: [],
    source: "osm",
    verified: false,
    ...overrides,
  };
}

const origin = { latitude: 44.7866, longitude: 20.4489 };

describe("filterPlacesByDistance", () => {
  it("returns all places when no max distance is given", () => {
    const places = [place({ id: "a", latitude: 46, longitude: 22 })];
    expect(filterPlacesByDistance(places, origin)).toHaveLength(1);
  });

  it("drops places beyond the max distance", () => {
    const near = place({ id: "near", latitude: 44.79, longitude: 20.45 });
    const far = place({ id: "far", latitude: 46.1, longitude: 22.9 });
    const result = filterPlacesByDistance([near, far], origin, 50);
    expect(result).toEqual([near]);
  });
});

describe("filterPlacesByBudget", () => {
  it("returns all places when no budget is given", () => {
    const places = [place({ id: "a", estimatedCostPerPerson: 9999 })];
    expect(filterPlacesByBudget(places, undefined)).toHaveLength(1);
  });

  it("keeps only places within 70% of the per-person budget", () => {
    // budget 10000 for 2 people => 5000 per person => threshold 3500.
    const cheap = place({ id: "cheap", estimatedCostPerPerson: 3000 });
    const overThreshold = place({ id: "over", estimatedCostPerPerson: 4000 });
    const result = filterPlacesByBudget([cheap, overThreshold], 10000, 2);
    expect(result).toEqual([cheap]);
  });
});

describe("filterPlacesByInterests", () => {
  it("returns all places when no interests are selected", () => {
    const places = [place({ id: "a" })];
    expect(filterPlacesByInterests(places, [])).toHaveLength(1);
  });

  it("matches on category or tags (case-insensitive)", () => {
    const history = place({ id: "h", category: "Istorija", tags: ["muzeji"] });
    const nature = place({ id: "n", category: "Priroda", tags: ["vidikovci"] });
    const result = filterPlacesByInterests([history, nature], ["istorija"]);
    expect(result).toEqual([history]);
  });
});
