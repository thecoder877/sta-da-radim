"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { authenticImageUrl } from "@/lib/places/placeImage";
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
  const src = authenticImageUrl(place);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 bg-muted px-4 text-center">
        <Camera className="size-6 text-muted-foreground" aria-hidden />
        {addHref ? (
          <Link href={addHref} className="text-sm font-medium text-primary hover:underline">
            Dodaj fotografiju
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Nema fotografije</span>
        )}
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
      onError={() => setFailed(true)}
    />
  );
}
