import { beforeEach, describe, expect, it } from "vitest";
import { getClientIp, rateLimit, resetRateLimits } from "./rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests up to the limit, then blocks", () => {
    const options = { limit: 3, windowMs: 1000 };
    const now = 1_000_000;
    expect(rateLimit("k", options, now).allowed).toBe(true);
    expect(rateLimit("k", options, now).allowed).toBe(true);
    expect(rateLimit("k", options, now).allowed).toBe(true);
    const blocked = rateLimit("k", options, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const options = { limit: 1, windowMs: 1000 };
    expect(rateLimit("k", options, 0).allowed).toBe(true);
    expect(rateLimit("k", options, 500).allowed).toBe(false);
    expect(rateLimit("k", options, 1500).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const options = { limit: 1, windowMs: 1000 };
    expect(rateLimit("a", options, 0).allowed).toBe(true);
    expect(rateLimit("b", options, 0).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to unknown when no ip headers are present", () => {
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});
