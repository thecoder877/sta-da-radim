import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { calculateDistanceKm } from "../../geo/distance.ts";

const MAX_LODGING_DISTANCE_KM = 20;
const RUMA = { latitude: 45.0081, longitude: 19.8222 };
const VRDNIK = { latitude: 45.1367, longitude: 19.7928 };
const NIS = { latitude: 43.3188, longitude: 21.8954 };
const KOPAONIK = { latitude: 43.2854, longitude: 20.8224 };

describe("lodging stay radius", () => {
  it("treats Vrdnik as a local night from Ruma", () => {
    assert.ok(calculateDistanceKm(RUMA, VRDNIK) <= MAX_LODGING_DISTANCE_KM);
  });

  it("rejects Niš and Kopaonik as overnight stops after a day in Srem", () => {
    assert.ok(calculateDistanceKm(RUMA, NIS) > MAX_LODGING_DISTANCE_KM);
    assert.ok(calculateDistanceKm(RUMA, KOPAONIK) > MAX_LODGING_DISTANCE_KM);
  });
});
