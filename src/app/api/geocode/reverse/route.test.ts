import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/security/rateLimit";

const reverseGeocode = vi.hoisted(() =>
  vi.fn(async () => ({
    name: "Beograd",
    coordinates: { latitude: 44.8, longitude: 20.45 },
  })),
);

vi.mock("@/lib/providers/geocoding/nominatim", () => ({ reverseGeocode }));

import { GET } from "./route";

function get(lat: string, lng: string, ip = "1.1.1.1"): Request {
  return new Request(`http://localhost/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/geocode/reverse", () => {
  beforeEach(() => {
    resetRateLimits();
    reverseGeocode.mockClear();
  });

  it("returns 400 for out-of-range coordinates", async () => {
    const res = await GET(get("999", "0"));
    expect(res.status).toBe(400);
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it("returns null without calling upstream for coordinates outside Serbia", async () => {
    const res = await GET(get("48.85", "2.35")); // Paris
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestion).toBeNull();
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it("reverse-geocodes coordinates inside Serbia", async () => {
    const res = await GET(get("44.8", "20.45"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestion.name).toBe("Beograd");
    expect(reverseGeocode).toHaveBeenCalledOnce();
  });

  it("rate-limits repeated requests", async () => {
    for (let i = 0; i < 60; i += 1) {
      await GET(get("44.8", "20.45", "8.8.8.8"));
    }
    const res = await GET(get("44.8", "20.45", "8.8.8.8"));
    expect(res.status).toBe(429);
  });
});
