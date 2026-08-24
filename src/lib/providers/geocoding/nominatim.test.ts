import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatSuggestion,
  mergeStartLocationSuggestions,
  rankNominatimResults,
  type NominatimSearchItem,
} from "./nominatim.ts";

function item(
  overrides: Partial<NominatimSearchItem> & Pick<NominatimSearchItem, "name" | "type">,
): NominatimSearchItem {
  return {
    lat: "45.0",
    lon: "19.8",
    display_name: `${overrides.name}, Srbija`,
    addresstype: overrides.type,
    ...overrides,
  };
}

describe("formatSuggestion", () => {
  it("keeps the village name instead of promoting the municipality", () => {
    const suggestion = formatSuggestion(
      item({
        name: "Jazak",
        type: "village",
        address: {
          village: "Jazak",
          municipality: "Irig",
          county: "Srem",
        },
      }),
    );
    assert.equal(suggestion.name, "Jazak");
    assert.ok(suggestion.detail?.includes("Irig"));
  });

  it("does not replace a settlement title with the parent city", () => {
    const suggestion = formatSuggestion(
      item({
        name: "Sremska Kamenica",
        type: "suburb",
        address: {
          suburb: "Sremska Kamenica",
          city: "Novi Sad",
        },
      }),
    );
    assert.equal(suggestion.name, "Sremska Kamenica");
    assert.ok(suggestion.detail?.includes("Novi Sad"));
  });
});

describe("rankNominatimResults", () => {
  it("ranks a matching village ahead of the municipality", () => {
    const ranked = rankNominatimResults(
      [
        item({ name: "Irig", type: "municipality", class: "boundary" }),
        item({ name: "Jazak", type: "village", lat: "45.1", lon: "19.76" }),
      ],
      "jazak",
    );
    assert.equal(ranked[0]?.name, "Jazak");
  });
});

describe("mergeStartLocationSuggestions", () => {
  it("surfaces known Serbian cities while typing", () => {
    const merged = mergeStartLocationSuggestions("ru", [], 6);
    assert.ok(merged.some((item) => item.name === "Ruma"));
  });
});
