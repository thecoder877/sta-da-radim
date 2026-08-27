import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  canEditGeneration,
  canStartGeneration,
  formatQuotaCountdown,
  monthKey,
  nextMonthResetAt,
  quotaFromUsage,
} from "./planQuota.ts";

describe("plan quota", () => {
  it("keys the month in Belgrade time", () => {
    assert.equal(monthKey(new Date("2026-08-24T10:00:00.000Z")), "2026-08");
  });

  it("resets at the start of the next month", () => {
    const reset = nextMonthResetAt(new Date("2026-08-24T10:00:00.000Z"));
    assert.equal(monthKey(reset), "2026-09");
  });

  it("blocks a fourth generation and a fourth edit", () => {
    const quota = quotaFromUsage(3, false, new Date("2026-08-24T10:00:00.000Z"));
    assert.equal(canStartGeneration(quota), false);
    assert.equal(canEditGeneration(3, false), false);
    assert.equal(canEditGeneration(2, false), true);
    assert.equal(canStartGeneration(quotaFromUsage(3, true)), true);
  });

  it("formats the wait until reset", () => {
    const text = formatQuotaCountdown(
      "2026-09-01T00:00:00.000+02:00",
      new Date("2026-08-24T12:00:00.000+02:00"),
    );
    assert.match(text, /dana/);
  });
});
