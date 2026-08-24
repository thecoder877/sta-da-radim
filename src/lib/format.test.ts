import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDurationMinutes, formatTravelTime } from "./format.ts";

describe("formatDurationMinutes", () => {
  it("keeps short trips in hours and minutes", () => {
    assert.equal(formatDurationMinutes(90), "1h 30min");
    assert.equal(formatDurationMinutes(120), "2h");
  });

  it("shows days for a long walk instead of 77h", () => {
    assert.equal(formatDurationMinutes(77 * 60 + 47), "3 dana 5h");
    assert.equal(formatTravelTime(77 * 60, "walk"), "~3 dana 5h hoda");
  });
});
