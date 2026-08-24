import Link from "next/link";
import { PlacePhoto } from "@/components/places/PlacePhoto";
import { formatDurationMinutes, formatRsd } from "@/lib/format";
import type { Place } from "@/types/place";

export function PlaceCard({ place }: { place: Place }) {
  const location = [place.city, place.region].filter(Boolean).join(" · ") || "Srbija";
  const duration = place.estimatedDurationMinutes
    ? formatDurationMinutes(place.estimatedDurationMinutes)
    : null;
  const cost = place.estimatedCostPerPerson
    ? formatRsd(place.estimatedCostPerPerson)
    : "Besplatno";

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-sm">
      <Link href={`/place/${place.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-muted">
          <PlacePhoto
            place={place}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted-foreground">
          {location} · {place.category}
        </p>
        <h3 className="font-heading text-xl leading-snug tracking-tight">
          <Link href={`/place/${place.slug}`} className="hover:underline">
            {place.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {place.shortDescription}
        </p>
        <p className="pt-1 text-sm text-muted-foreground">
          {[duration, cost].filter(Boolean).join(" · ")}
        </p>
      </div>
    </article>
  );
}
