import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANON_QUOTA_COOKIE, encodeQuota } from "@/lib/access/serverGenerationQuota";
import { resetRateLimits } from "@/lib/security/rateLimit";

const state = vi.hoisted(() => ({
  supabaseConfigured: false,
  user: null as { id: string } | null,
  cookieValue: undefined as string | undefined,
}));

const generateTrip = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookieValue !== undefined ? { name, value: state.cookieValue } : undefined,
    set: () => {},
  }),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => state.user }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => state.supabaseConfigured,
}));
vi.mock("@/lib/ai/generateTrip", () => ({ generateTrip }));

import { POST } from "./route";

const fakeTrip = {
  id: "trip-1",
  title: "Test",
  startLocation: "Beograd",
  startDate: "2026-09-01",
  days: 1,
  transport: "car",
  stops: [
    { id: "s1", placeId: "p1", place: {}, arrivalTime: "09:00", durationMinutes: 60 },
  ],
  daysPlan: [{ dayNumber: 1, date: "2026-09-01", stops: [] }],
  createdAt: "2026-08-24T00:00:00.000Z",
};

const validBody = {
  startLocation: { name: "Beograd", coordinates: { latitude: 44.78, longitude: 20.44 } },
  startDate: "2026-09-01",
  days: 1,
  numberOfPeople: 2,
  transport: "car",
  interests: ["priroda"],
  travelStyle: "balanced",
};

function post(body: unknown, ip = "1.1.1.1"): Request {
  return new Request("http://localhost/api/trips/generate", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/trips/generate", () => {
  beforeEach(() => {
    resetRateLimits();
    state.supabaseConfigured = false;
    state.user = null;
    state.cookieValue = undefined;
    generateTrip.mockReset();
    generateTrip.mockResolvedValue(fakeTrip);
  });

  it("returns 200 with a trip for a valid request (no Supabase)", async () => {
    const res = await POST(post(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.trip.id).toBe("trip-1");
  });

  it("returns 400 for an invalid request", async () => {
    const res = await POST(post({ startLocation: { name: "" } }));
    expect(res.status).toBe(400);
    expect(generateTrip).not.toHaveBeenCalled();
  });

  it("sets the quota cookie on the first anonymous generation when Supabase is configured", async () => {
    state.supabaseConfigured = true;
    const res = await POST(post(validBody, "2.2.2.2"));
    expect(res.status).toBe(200);
    expect(res.cookies.get(ANON_QUOTA_COOKIE)?.value).toBeTruthy();
  });

  it("blocks a second anonymous generation once the quota cookie is at the limit", async () => {
    state.supabaseConfigured = true;
    state.cookieValue = encodeQuota(1);
    const res = await POST(post(validBody, "3.3.3.3"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.code).toBe("AUTH_REQUIRED");
    expect(generateTrip).not.toHaveBeenCalled();
  });

  it("does not enforce the quota for logged-in users", async () => {
    state.supabaseConfigured = true;
    state.user = { id: "user-1" };
    state.cookieValue = encodeQuota(5);
    const res = await POST(post(validBody, "4.4.4.4"));
    expect(res.status).toBe(200);
  });

  it("rate-limits excessive requests", async () => {
    for (let i = 0; i < 20; i += 1) {
      await POST(post(validBody, "5.5.5.5"));
    }
    const res = await POST(post(validBody, "5.5.5.5"));
    expect(res.status).toBe(429);
  });
});
