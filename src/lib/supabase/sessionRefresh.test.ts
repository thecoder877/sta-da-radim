import { describe, expect, it } from "vitest";
import { shouldRefreshAuthSession } from "./sessionRefresh";

describe("shouldRefreshAuthSession", () => {
  it("refreshes the session on page navigations", () => {
    expect(shouldRefreshAuthSession("/login")).toBe(true);
    expect(shouldRefreshAuthSession("/saved")).toBe(true);
    expect(shouldRefreshAuthSession("/")).toBe(true);
  });

  it("skips API routes that authenticate themselves", () => {
    expect(shouldRefreshAuthSession("/api/auth/login")).toBe(false);
    expect(shouldRefreshAuthSession("/api/auth/register")).toBe(false);
    expect(shouldRefreshAuthSession("/api/auth/me")).toBe(false);
    expect(shouldRefreshAuthSession("/api/trips/generate")).toBe(false);
  });
});
