import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultMaxDistanceKm,
  effectiveSearchRadiusKm,
  impliedSpeedKmh,
  sanitizeTravelMinutes,
} from "./travelTime.ts";

describe("sanitizeTravelMinutes", () => {
  it("replaces car-speed duration on a walking trip", () => {
    const minutes = sanitizeTravelMinutes(350, 6.5 * 60, "walk");
    assert.ok(minutes > 60 * 60);
    assert.ok(impliedSpeedKmh(350, minutes) < 6);
  });

  it("keeps a realistic walking duration", () => {
    assert.equal(sanitizeTravelMinutes(9, 120, "walk"), 120);
  });

  it("uses the pace model when duration is missing", () => {
    assert.equal(sanitizeTravelMinutes(9, undefined, "walk"), 120);
  });

  it("does not rewrite a normal car duration", () => {
    assert.equal(sanitizeTravelMinutes(110, 120, "car"), 120);
  });
});

describe("defaultMaxDistanceKm", () => {
  it("caps unlimited walking trips to a local loop", () => {
    assert.equal(defaultMaxDistanceKm("walk"), 20);
  });

  it("respects an explicit walking radius before the daily cap", () => {
    assert.equal(defaultMaxDistanceKm("walk", 350), 350);
  });
});

describe("effectiveSearchRadiusKm", () => {
  it("does not let a one-day walk search 250 km away", () => {
    assert.equal(effectiveSearchRadiusKm("walk", 250, 1), 18);
  });

  it("grows with multi-day walking trips", () => {
    assert.equal(effectiveSearchRadiusKm("walk", 250, 4), 72);
  });

  it("leaves car radius unchanged", () => {
    assert.equal(effectiveSearchRadiusKm("car", 100, 1), 100);
  });
});
