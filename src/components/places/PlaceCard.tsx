import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { formatDurationMinutes, formatRsd } from "@/lib/format";
import type { Place } from "@/types/place";
import { Badge } from "@/components/ui/badge";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8">
      <Link href={`/place/${place.slug}`} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {place.imageUrl ? (
            <Image
              src={place.imageUrl}
              alt={place.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl">
              <Link href={`/place/${place.slug}`} className="hover:underline">
                {place.name}
              </Link>
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {[place.city, place.region].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Badge variant="secondary">{place.category}</Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {place.shortDescription}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {place.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag.replace("-", " ")}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {place.estimatedDurationMinutes ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatDurationMinutes(place.estimatedDurationMinutes)}
            </span>
          ) : null}
          {place.estimatedCostPerPerson ? (
            <span>Procena {formatRsd(place.estimatedCostPerPerson)}</span>
          ) : (
            <span>Ulaz uglavnom bez naknade</span>
          )}
        </div>
      </div>
    </article>
  );
}
