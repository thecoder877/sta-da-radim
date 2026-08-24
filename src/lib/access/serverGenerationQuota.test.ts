import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decodeQuota, encodeQuota } from "./serverGenerationQuota";

const originalSecret = process.env.APP_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.APP_SECRET;
  } else {
    process.env.APP_SECRET = originalSecret;
  }
});

describe("quota cookie without APP_SECRET", () => {
  beforeEach(() => {
    delete process.env.APP_SECRET;
  });

  it("round-trips a plain count", () => {
    expect(decodeQuota(encodeQuota(2))).toBe(2);
  });

  it("treats missing/garbage values as zero", () => {
    expect(decodeQuota(undefined)).toBe(0);
    expect(decodeQuota("-5")).toBe(0);
    expect(decodeQuota("abc")).toBe(0);
  });
});

describe("quota cookie with APP_SECRET", () => {
  beforeEach(() => {
    process.env.APP_SECRET = "test-secret";
  });

  it("round-trips a signed count", () => {
    expect(decodeQuota(encodeQuota(1))).toBe(1);
  });

  it("rejects a tampered payload", () => {
    const signed = encodeQuota(1);
    const [, signature] = signed.split(".");
    // Attacker bumps the count but keeps the old signature.
    expect(decodeQuota(`5.${signature}`)).toBe(0);
  });

  it("rejects an unsigned value when a secret is configured", () => {
    expect(decodeQuota("3")).toBe(0);
  });
});
