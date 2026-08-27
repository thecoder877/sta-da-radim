import { describe, expect, it } from "vitest";
import { withTimeout } from "./withTimeout";

describe("withTimeout", () => {
  it("resolves when the promise finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });

  it("rejects when the promise takes too long", async () => {
    await expect(
      withTimeout(new Promise(() => undefined), 20, "too slow"),
    ).rejects.toThrow("too slow");
  });
});
