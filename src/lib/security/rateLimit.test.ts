import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit } from "./rateLimit.ts";

describe("rateLimit", () => {
  it("allows requests under the limit and blocks after", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    const blocked = rateLimit(key, 2, 60_000);
    assert.equal(blocked.ok, false);
  });
});
