import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/security/rateLimit";

const searchLocations = vi.hoisted(() =>
  vi.fn(async () => [
    { name: "Beograd", coordinates: { latitude: 44.8, longitude: 20.45 } },
  ]),
);

vi.mock("@/lib/providers/geocoding/nominatim", () => ({ searchLocations }));

import { GET } from "./route";

function get(query: string, ip = "1.1.1.1"): Request {
  return new Request(`http://localhost/api/geocode/search?q=${encodeURIComponent(query)}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/geocode/search", () => {
  beforeEach(() => {
    resetRateLimits();
    searchLocations.mockClear();
  });

  it("returns suggestions for a query", async () => {
    const res = await GET(get("Beograd"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(1);
  });

  it("clamps overly long queries before hitting upstream", async () => {
    await GET(get("x".repeat(500)));
    const passedQuery = searchLocations.mock.calls[0]?.[0] as string;
    expect(passedQuery.length).toBeLessThanOrEqual(120);
  });

  it("rate-limits repeated requests", async () => {
    for (let i = 0; i < 60; i += 1) {
      await GET(get("Beograd", "7.7.7.7"));
    }
    const res = await GET(get("Beograd", "7.7.7.7"));
    expect(res.status).toBe(429);
  });
});
