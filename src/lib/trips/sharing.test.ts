import { describe, expect, it } from "vitest";
import { createShareSlug } from "./sharing";

describe("createShareSlug", () => {
  it("keeps a slugified base of the title", () => {
    expect(createShareSlug("Vikend na Tari")).toMatch(/^vikend-na-tari-[0-9a-f]{16}$/);
  });

  it("still produces a valid slug when the title has no usable characters", () => {
    // slugify() already falls back to "mesto" for junk input.
    expect(createShareSlug("!!!")).toMatch(/^mesto-[0-9a-f]{16}$/);
  });

  it("is unique across calls with the same title", () => {
    const a = createShareSlug("Isti naslov");
    const b = createShareSlug("Isti naslov");
    expect(a).not.toBe(b);
  });
});
