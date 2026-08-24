import { Clock, MapPinned, Route, Users, Wallet } from "lucide-react";
import {
  formatDayLabel,
  formatDistance,
  formatRsd,
  formatTravelTime,
  formatTripDate,
} from "@/lib/format";
import type { GeneratedTrip } from "@/types/trip";

export function TripSummary({ trip }: { trip: GeneratedTrip }) {
  const metrics = [
    {
      label: formatDayLabel(trip.days),
      icon: Clock,
    },
    {
      label: trip.totalDistanceKm ? `~${formatDistance(trip.totalDistanceKm)}` : "Udaljenost uskoro",
      icon: Route,
    },
    {
      label: trip.totalTravelMinutes
        ? formatTravelTime(trip.totalTravelMinutes, trip.transport)
        : "Vreme puta uskoro",
      icon: MapPinned,
    },
    {
      label: trip.estimatedTotalCost
        ? `~${formatRsd(trip.estimatedTotalCost)}`
        : "Trošak nije procenjen",
      icon: Wallet,
    },
    {
      label: (() => {
        const nights = trip.stops.filter((stop) => stop.kind === "lodging").length;
        const visits = trip.stops.length - nights;
        return nights > 0 ? `${visits} mesta · ${nights} noćenja` : `${visits} lokacija`;
      })(),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Polazak iz {trip.startLocation} · {formatTripDate(trip.startDate)}
        </p>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl">{trip.title}</h1>
        {trip.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {trip.description}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Kilometraža i vreme su vožnja između poseta, bez obilazaka do smeštaja. Cene su procena.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/8"
          >
            <metric.icon className="mb-2 size-4 text-primary" aria-hidden />
            <dd className="text-sm font-medium">{metric.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
