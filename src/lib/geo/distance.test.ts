import { describe, expect, it } from "vitest";
import { calculateDistanceKm, estimateTravelMinutes, toCoordinates } from "./distance";

describe("calculateDistanceKm", () => {
  it("is zero for identical points", () => {
    const point = { latitude: 44.7866, longitude: 20.4489 };
    expect(calculateDistanceKm(point, point)).toBe(0);
  });

  it("approximates the Belgrade -> Novi Sad great-circle distance", () => {
    const belgrade = { latitude: 44.7866, longitude: 20.4489 };
    const noviSad = { latitude: 45.2671, longitude: 19.8335 };
    const distance = calculateDistanceKm(belgrade, noviSad);
    // Real straight-line distance is ~70 km.
    expect(distance).toBeGreaterThan(65);
    expect(distance).toBeLessThan(80);
  });

  it("is symmetric", () => {
    const a = { latitude: 43.32, longitude: 21.9 };
    const b = { latitude: 44.01, longitude: 20.91 };
    expect(calculateDistanceKm(a, b)).toBeCloseTo(calculateDistanceKm(b, a), 10);
  });
});

describe("estimateTravelMinutes", () => {
  it("uses the per-transport speed", () => {
    // 55 km at 55 km/h = 60 minutes by car.
    expect(estimateTravelMinutes(55, "car")).toBe(60);
    // Walking is much slower than driving for the same distance.
    expect(estimateTravelMinutes(10, "walk")).toBeGreaterThan(
      estimateTravelMinutes(10, "car"),
    );
  });
});

describe("toCoordinates", () => {
  it("builds a coordinate object", () => {
    expect(toCoordinates(1, 2)).toEqual({ latitude: 1, longitude: 2 });
  });
});
