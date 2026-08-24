import type { GeneratedTrip } from "@/types/trip";
import { TripStopCard } from "@/components/trip/TripStopCard";
import { cn } from "@/lib/utils";

export function TripTimeline({
  trip,
  selectedPlaceId,
  onShowOnMap,
}: {
  trip: GeneratedTrip;
  selectedPlaceId?: string;
  onShowOnMap?: (placeId: string) => void;
}) {
  return (
    <div className="space-y-10">
      {trip.daysPlan.map((day) => (
        <section key={day.dayNumber}>
          {trip.daysPlan.length > 1 ? (
            <h2 className="mb-5 font-heading text-2xl tracking-tight">Dan {day.dayNumber}</h2>
          ) : null}
          <ol className="relative space-y-6 border-l border-border pl-6">
            {day.dayNumber === 1 ? (
              <li className="relative">
                <span className="absolute -left-[1.54rem] top-1.5 size-2.5 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">09:00</span>
                  {" · "}Polazak iz {trip.startLocation}
                </p>
              </li>
            ) : null}
            {day.stops.map((stop) => (
              <li key={stop.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.54rem] top-5 size-2.5 rounded-full",
                    stop.kind === "lodging" ? "bg-ochre" : "bg-primary",
                  )}
                />
                {stop.kind === "lodging" ? (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ochre-foreground">
                    Predlog za noćenje
                  </p>
                ) : null}
                <TripStopCard
                  stop={stop}
                  selected={selectedPlaceId === stop.placeId}
                  onShowOnMap={onShowOnMap}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
