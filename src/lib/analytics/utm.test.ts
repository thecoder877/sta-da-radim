import { describe, expect, it } from "vitest";
import { parseUtmFromSearch } from "./utm";

describe("parseUtmFromSearch", () => {
  it("extracts all utm params", () => {
    const result = parseUtmFromSearch(
      "?utm_source=facebook&utm_medium=cpc&utm_campaign=leto&utm_term=tara&utm_content=ad1",
    );
    expect(result).toEqual({
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "leto",
      utm_term: "tara",
      utm_content: "ad1",
    });
  });

  it("ignores non-utm params and works without a leading '?'", () => {
    expect(parseUtmFromSearch("utm_source=news&foo=bar")).toEqual({
      utm_source: "news",
    });
  });

  it("returns an empty object when there are no utm params", () => {
    expect(parseUtmFromSearch("?foo=bar")).toEqual({});
  });

  it("caps very long values", () => {
    const long = "x".repeat(500);
    expect(parseUtmFromSearch(`?utm_source=${long}`).utm_source?.length).toBe(200);
  });
});
