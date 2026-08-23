import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANONYMOUS_GENERATION_KEY,
  getGenerationAccess,
  hasUsedAnonymousGeneration,
  markAnonymousGenerationUsed,
  tripSuccessfullyGenerated,
  type GenerationAccessStore,
} from "./generationAccess.ts";

class MemoryStore implements GenerationAccessStore {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("generation access", () => {
  it("allows one anonymous generation, then requires auth", () => {
    const store = new MemoryStore();
    assert.deepEqual(getGenerationAccess(false, store), {
      allowed: true,
      mode: "anonymous_free",
    });
    markAnonymousGenerationUsed(store, new Date("2026-08-24T00:00:00.000Z"));
    assert.equal(hasUsedAnonymousGeneration(store), true);
    assert.deepEqual(getGenerationAccess(false, store), {
      allowed: false,
      reason: "AUTH_REQUIRED",
    });
    assert.equal(store.getItem(ANONYMOUS_GENERATION_KEY), JSON.stringify({
      used: true,
      usedAt: "2026-08-24T00:00:00.000Z",
    }));
  });

  it("ignores the anonymous flag for authenticated users", () => {
    const store = new MemoryStore();
    markAnonymousGenerationUsed(store);
    assert.deepEqual(getGenerationAccess(true, store), {
      allowed: true,
      mode: "authenticated",
    });
  });

  it("does not treat an incomplete itinerary as a successful generation", () => {
    assert.equal(tripSuccessfullyGenerated(null), false);
    assert.equal(tripSuccessfullyGenerated({ id: "x", daysPlan: [], stops: [] }), false);
    assert.equal(
      tripSuccessfullyGenerated({ id: "x", daysPlan: [{ dayNumber: 1 }], stops: [] }),
      true,
    );
  });
});
