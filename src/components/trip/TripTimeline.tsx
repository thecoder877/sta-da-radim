import type { GeneratedTrip } from "@/types/trip";
import { TripStopCard } from "@/components/trip/TripStopCard";

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
    <div className="space-y-8">
      {trip.daysPlan.map((day) => (
        <section key={day.dayNumber} className="space-y-4">
          {trip.daysPlan.length > 1 ? (
            <h2 className="font-heading text-2xl">Dan {day.dayNumber}</h2>
          ) : null}
          <ol className="space-y-4">
            {day.dayNumber === 1 ? (
              <li className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm">
                <span className="font-medium">09:00</span>
                <span className="text-muted-foreground">
                  {" "}
                  · Polazak iz {trip.startLocation}
                </span>
              </li>
            ) : null}
            {day.stops.map((stop) => (
              stop.kind === "lodging" ? (
              <li key={stop.id} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Predlog za noćenje
                </p>
                <TripStopCard
                  stop={stop}
                  selected={selectedPlaceId === stop.placeId}
                  onShowOnMap={onShowOnMap}
                />
              </li>
              ) : (
              <li key={stop.id}>
                <TripStopCard
                  stop={stop}
                  selected={selectedPlaceId === stop.placeId}
                  onShowOnMap={onShowOnMap}
                />
              </li>
              )
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
