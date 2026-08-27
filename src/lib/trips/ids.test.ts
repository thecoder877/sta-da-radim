import { describe, expect, it } from "vitest";
import { isUuid } from "./ids";

describe("isUuid", () => {
  it("accepts a valid v4 uuid", () => {
    expect(isUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("rejects non-uuid values", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("123")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("beograd-iz-beograd-leicp")).toBe(false);
  });
});
