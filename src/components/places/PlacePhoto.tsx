"use client";

import { useState } from "react";
import Image from "next/image";
import { fallbackPlaceImage } from "@/lib/places/placeImage";
import type { Place } from "@/types/place";

export function PlacePhoto({
  place,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  place: Place;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const primary = place.imageUrl;
  const fallback = fallbackPlaceImage(place);
  const [src, setSrc] = useState(primary ?? fallback);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-end bg-[linear-gradient(160deg,#c45c26_0%,#8a5a32_45%,#3f4a38_100%)] p-4">
        <span className="font-heading text-xl text-white">{place.name}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? place.name}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
      unoptimized={src.startsWith("/api/") || src.includes("wikimedia.org")}
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
