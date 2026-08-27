import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserFromClient } from "./session";

describe("getUserFromClient", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the user when getUser succeeds", async () => {
    const supabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }),
      },
    };
    const user = await getUserFromClient(supabase as never);
    expect(user?.id).toBe("user-1");
  });

  it("returns null when getUser never resolves", async () => {
    vi.useFakeTimers();
    const supabase = {
      auth: {
        getUser: () => new Promise(() => undefined),
      },
    };
    const pending = getUserFromClient(supabase as never);
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toBeNull();
  });
});
