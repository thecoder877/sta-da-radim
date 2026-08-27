import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { drivingWaypoints } from "./routeWaypoints.ts";
import type { GeneratedTrip, TripStop } from "../../types/trip.ts";

function stop(
  id: string,
  lat: number,
  lng: number,
  kind: TripStop["kind"] = "visit",
): TripStop {
  return {
    id,
    placeId: id,
    arrivalTime: "10:00",
    durationMinutes: 60,
    kind,
    place: {
      id,
      name: id,
      slug: id,
      shortDescription: id,
      latitude: lat,
      longitude: lng,
      category: kind === "lodging" ? "Smeštaj" : "Priroda",
      tags: [],
      source: "internal",
      verified: true,
    },
  };
}

function trip(stops: TripStop[]): GeneratedTrip {
  return {
    id: "t1",
    title: "Test",
    startLocation: "Ruma",
    startDate: "2026-08-24",
    days: 4,
    transport: "car",
    stops,
    daysPlan: [{ dayNumber: 1, date: "2026-08-24", stops }],
    startCoordinates: { latitude: 45.0081, longitude: 19.8222 },
    createdAt: "2026-08-24T00:00:00.000Z",
  };
}

describe("drivingWaypoints", () => {
  it("skips lodging so overnight hotels cannot inflate the drive", () => {
    const points = drivingWaypoints(
      trip([
        stop("a", 45.25, 19.84),
        stop("hotel", 43.32, 21.89, "lodging"),
        stop("b", 45.26, 19.85),
      ]),
      { latitude: 45.0081, longitude: 19.8222 },
    );
    assert.equal(points.length, 3);
    assert.equal(points[1]?.latitude, 45.25);
    assert.equal(points[2]?.latitude, 45.26);
  });

  it("keeps every visit on a long itinerary, not a 9-stop subset", () => {
    const visits = Array.from({ length: 12 }, (_, index) =>
      stop(`v${index}`, 45 + index * 0.02, 19.8 + index * 0.01),
    );
    const points = drivingWaypoints(trip(visits), {
      latitude: 45.0081,
      longitude: 19.8222,
    });
    assert.equal(points.length, 13);
    for (const visit of visits) {
      assert.ok(points.some((point) => point.latitude === visit.place.latitude));
    }
  });
});
