import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  authenticImageUrl,
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
  it("keeps the original Wikimedia files in /images", () => {
    assert.equal(isAuthenticPlaceImage("/images/krusedol.jpg"), true);
    assert.equal(
      withPlaceImage(place("/images/krusedol.jpg")).imageUrl,
      "/images/krusedol.jpg",
    );
  });

  it("rejects Unsplash stock covers", () => {
    assert.equal(
      isAuthenticPlaceImage(
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format",
      ),
      false,
    );
    assert.equal(
      authenticImageUrl(place("https://images.unsplash.com/photo-x")),
      undefined,
    );
    assert.equal(
      withPlaceImage(place("https://images.unsplash.com/photo-x")).imageUrl,
      undefined,
    );
  });

  it("keeps Wikimedia and Google photo proxy URLs", () => {
    assert.equal(
      isAuthenticPlaceImage(
        "https://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg?width=1200",
      ),
      true,
    );
    assert.equal(isAuthenticPlaceImage("/api/places/photo?ref=abc"), true);
  });

  it("leaves a place empty when there is no real photo", () => {
    assert.equal(withPlaceImage(place()).imageUrl, undefined);
  });

  it("reads an OSM File: tag as Wikimedia", () => {
    const url = imageFromOsmTags({ wikimedia_commons: "File:Manastir_Jazak.jpg" });
    assert.ok(url?.includes("commons.wikimedia.org"));
  });
});
