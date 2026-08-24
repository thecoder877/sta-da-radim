"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { displayImageUrl, fallbackPlaceImage } from "@/lib/places/placeImage";
import type { Place } from "@/types/place";

export function PlacePhoto({
  place,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
  addHref,
}: {
  place: Place;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  addHref?: string;
}) {
  const primary = displayImageUrl(place);
  const fallback = fallbackPlaceImage(place);
  const [src, setSrc] = useState(primary);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative z-10 flex h-full w-full items-end bg-[linear-gradient(160deg,#c45c26_0%,#8a5a32_45%,#3f4a38_100%)] p-4">
        <span className="font-heading text-xl text-white">{place.name}</span>
        {addHref ? (
          <Link
            href={addHref}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground"
          >
            Dodaj fotografiju
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
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
      {addHref ? (
        <Link
          href={addHref}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
        >
          Dodaj fotografiju
        </Link>
      ) : null}
    </>
  );
}
