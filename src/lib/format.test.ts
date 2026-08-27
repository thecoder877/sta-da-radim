import { describe, expect, it } from "vitest";
import {
  foldSerbian,
  formatDistance,
  formatDurationMinutes,
  formatRsd,
  formatTravelTime,
  slugify,
} from "./format";

describe("foldSerbian", () => {
  it("transliterates Cyrillic to Latin", () => {
    expect(foldSerbian("Београд")).toBe("beograd");
    expect(foldSerbian("Ниш")).toBe("nis");
  });

  it("strips Latin diacritics", () => {
    expect(foldSerbian("Čačak")).toBe("cacak");
    expect(foldSerbian("Đerdap")).toBe("djerdap");
    expect(foldSerbian("Užice")).toBe("uzice");
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("Novi Sad")).toBe("novi-sad");
    expect(slugify("Fruška gora")).toBe("fruska-gora");
  });

  it("falls back to 'mesto' for empty input", () => {
    expect(slugify("!!!")).toBe("mesto");
  });
});

describe("formatRsd", () => {
  it("rounds and appends the currency", () => {
    expect(formatRsd(1234.6)).toContain("RSD");
    expect(formatRsd(1000)).toContain("RSD");
  });
});

describe("formatDistance", () => {
  it("keeps one decimal under 10 km and rounds above", () => {
    expect(formatDistance(4.25)).toBe("4.3 km");
    expect(formatDistance(56.7)).toBe("57 km");
  });
});

describe("formatDurationMinutes", () => {
  it("formats minutes and hours", () => {
    expect(formatDurationMinutes(45)).toBe("45 min");
    expect(formatDurationMinutes(60)).toBe("1h");
    expect(formatDurationMinutes(90)).toBe("1h 30min");
    expect(formatDurationMinutes(120)).toBe("2h");
    expect(formatDurationMinutes(135)).toBe("2h 15min");
  });

  it("shows days for a long walk instead of 77h", () => {
    expect(formatDurationMinutes(77 * 60 + 47)).toBe("3 dana 5h");
    expect(formatTravelTime(77 * 60, "walk")).toBe("~3 dana 5h hoda");
  });
});
