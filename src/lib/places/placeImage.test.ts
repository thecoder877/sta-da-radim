import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authenticImageUrl,
  displayImageUrl,
  fallbackPlaceImage,
  imageFromOsmTags,
  isAuthenticPlaceImage,
  withPlaceImage,
} from "./placeImage.ts";
import type { Place } from "../../types/place.ts";

function place(imageUrl?: string): Place {
  return {
    id: "osm-node-1",
    name: "Jazak",
    slug: "jazak",
    shortDescription: "Selo",
    latitude: 45.1,
    longitude: 19.7,
    category: "Priroda",
    tags: ["priroda"],
    imageUrl,
    source: "osm",
    verified: false,
  };
}

describe("place images", () => {
  it("does not treat Unsplash covers as authentic location photos", () => {
    assert.equal(
      isAuthenticPlaceImage("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format"),
      false,
    );
  });

  it("rejects missing local marketing images", () => {
    assert.equal(isAuthenticPlaceImage("/images/krusedol.jpg"), false);
  });

  it("keeps Wikimedia and Google photo proxy URLs", () => {
    assert.equal(
      isAuthenticPlaceImage("https://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg?width=1200"),
      true,
    );
    assert.equal(isAuthenticPlaceImage("/api/places/photo?ref=abc"), true);
  });

  it("fills empty and missing local files with a stable category cover", () => {
    const cover = fallbackPlaceImage(place());
    assert.match(cover, /images\.unsplash\.com/);
    assert.equal(displayImageUrl(place()), cover);
    assert.equal(displayImageUrl(place("/images/krusedol.jpg")), cover);
    assert.equal(withPlaceImage(place()).imageUrl, cover);
    assert.equal(withPlaceImage(place("/images/krusedol.jpg")).imageUrl, cover);
  });

  it("keeps Unsplash covers for display so cards are not empty", () => {
    const stock = "https://images.unsplash.com/photo-x";
    assert.equal(authenticImageUrl(place(stock)), undefined);
    assert.equal(withPlaceImage(place(stock)).imageUrl, stock);
  });

  it("reads an OSM File: tag as Wikimedia", () => {
    const url = imageFromOsmTags({ wikimedia_commons: "File:Manastir_Jazak.jpg" });
    assert.ok(url?.includes("commons.wikimedia.org"));
  });
});
