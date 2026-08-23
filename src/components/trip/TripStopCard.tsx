import Image from "next/image";
import Link from "next/link";
import { Clock, Coins } from "lucide-react";
import { formatDurationMinutes, formatRsd } from "@/lib/format";
import type { TripStop } from "@/types/trip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TripStopCard({
  stop,
  selected,
  onShowOnMap,
}: {
  stop: TripStop;
  selected?: boolean;
  onShowOnMap?: (placeId: string) => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl bg-card ring-1 ${
        selected ? "ring-primary" : "ring-foreground/8"
      }`}
    >
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="relative min-h-36 bg-muted">
          {stop.place.imageUrl ? (
            <Image
              src={stop.place.imageUrl}
              alt={stop.place.name}
              fill
              className="object-cover"
              sizes="140px"
            />
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{stop.arrivalTime}</p>
              <h3 className="font-heading text-xl">{stop.place.name}</h3>
            </div>
            <Badge variant="secondary">{stop.place.category}</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {stop.reason ?? stop.place.shortDescription}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatDurationMinutes(stop.durationMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="size-3.5" aria-hidden />
              {stop.estimatedCost
                ? `Procena ${formatRsd(stop.estimatedCost)}`
                : "Bez dodatnog troška"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" render={<Link href={`/place/${stop.place.slug}`} />}>
              Detalji
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShowOnMap?.(stop.placeId)}
            >
              Prikaži na mapi
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
