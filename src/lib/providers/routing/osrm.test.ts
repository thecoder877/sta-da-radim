import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { osrmRouteUrl } from "./osrm.ts";

describe("osrmRouteUrl", () => {
  it("uses FOSSGIS routed-foot for walking, not /route/v1/foot", () => {
    const url = osrmRouteUrl(
      "https://routing.openstreetmap.de",
      "walking",
      "20.4,44.8;19.8,45.0",
    );
    assert.equal(
      url,
      "https://routing.openstreetmap.de/routed-foot/route/v1/driving/20.4,44.8;19.8,45.0?overview=full&geometries=geojson",
    );
  });

  it("does not ask the public car-only OSRM for a walking route", () => {
    assert.equal(
      osrmRouteUrl("https://router.project-osrm.org", "walking", "20.4,44.8;19.8,45.0"),
      null,
    );
  });

  it("keeps project-osrm for driving", () => {
    const url = osrmRouteUrl(
      "https://router.project-osrm.org",
      "driving",
      "20.4,44.8;19.8,45.0",
    );
    assert.ok(url?.includes("/route/v1/driving/"));
  });
});
