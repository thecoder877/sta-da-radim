import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAuthMe } from "./fetchAuthMe";

describe("fetchAuthMe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the session payload when /api/auth/me succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ user: { id: "user-1" }, profile: null, quota: null }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );
    await expect(fetchAuthMe()).resolves.toEqual({
      user: { id: "user-1" },
      profile: null,
      quota: null,
    });
  });

  it("returns null when the session endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(fetchAuthMe()).resolves.toBeNull();
  });
});
