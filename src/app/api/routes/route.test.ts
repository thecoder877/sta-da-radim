import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/security/rateLimit";

vi.mock("@/lib/providers/routing", () => ({
  getTripRoute: vi.fn(async () => ({
    distanceKm: 10,
    durationMinutes: 20,
    coordinates: [
      { latitude: 1, longitude: 1 },
      { latitude: 2, longitude: 2 },
    ],
  })),
}));

import { POST } from "./route";

function post(body: unknown, ip = "1.1.1.1"): Request {
  return new Request("http://localhost/api/routes", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const validBody = {
  points: [
    { latitude: 44.8, longitude: 20.4 },
    { latitude: 45.2, longitude: 19.8 },
  ],
  transport: "car",
};

describe("POST /api/routes", () => {
  beforeEach(() => resetRateLimits());

  it("returns 400 for out-of-range coordinates", async () => {
    const res = await POST(
      post({
        points: [
          { latitude: 999, longitude: 0 },
          { latitude: 1, longitude: 1 },
        ],
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.route).toBeNull();
  });

  it("returns 400 for fewer than two points", async () => {
    const res = await POST(post({ points: [{ latitude: 44.8, longitude: 20.4 }] }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with a route for a valid body", async () => {
    const res = await POST(post(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.route.coordinates.length).toBeGreaterThan(1);
  });

  it("rate-limits after the per-window budget is exceeded", async () => {
    for (let i = 0; i < 60; i += 1) {
      await POST(post(validBody, "9.9.9.9"));
    }
    const res = await POST(post(validBody, "9.9.9.9"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
