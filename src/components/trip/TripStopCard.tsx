import Link from "next/link";
import { PlacePhoto } from "@/components/places/PlacePhoto";
import { formatDurationMinutes, formatRsd } from "@/lib/format";
import type { TripStop } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TripStopCard({
  stop,
  selected,
  onShowOnMap,
}: {
  stop: TripStop;
  selected?: boolean;
  onShowOnMap?: (placeId: string) => void;
}) {
  const lodging = stop.kind === "lodging";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        selected ? "border-primary" : "border-border",
        lodging && "bg-secondary/40",
      )}
    >
      <div className="grid sm:grid-cols-[128px_1fr]">
        <div className="relative min-h-32 bg-muted">
          <PlacePhoto
            place={stop.place}
            sizes="128px"
            addHref={`/place/${stop.place.slug}#fotografije`}
          />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">{stop.arrivalTime}</p>
          <h3 className="font-heading text-xl leading-snug tracking-tight">{stop.place.name}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {stop.reason ?? stop.place.shortDescription}
          </p>
          <p className="text-sm text-muted-foreground">
            {lodging
              ? "Noćenje"
              : formatDurationMinutes(stop.durationMinutes)}
            {" · "}
            {stop.estimatedCost ? `Procena ${formatRsd(stop.estimatedCost)}` : "Bez dodatnog troška"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" render={<Link href={`/place/${stop.place.slug}`} />}>
              Detalji
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onShowOnMap?.(stop.placeId)}>
              Prikaži na mapi
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
