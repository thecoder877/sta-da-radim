"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEMO_TRIP } from "@/data/demoTrip";
import { readGeneratedTrip } from "@/lib/trips/storage";
import { TripResultView } from "@/components/trip/TripResultView";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import type { GeneratedTrip } from "@/types/trip";

export function TripPageClient({ id }: { id: string }) {
  if (id === "demo") {
    return <TripResultView trip={DEMO_TRIP} />;
  }

  return <StoredTripView id={id} />;
}

function StoredTripView({ id }: { id: string }) {
  const [trip, setTrip] = useState<GeneratedTrip | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTrip(readGeneratedTrip(id));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [id]);

  if (!ready) {
    return <LoadingState message="Otvaramo tvoj plan..." />;
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Putovanje nije pronađeno"
          description="Ovaj plan postoji samo u ovoj sesiji. Ako si zatvorio karticu, napravi novi plan."
          action={
            <Button render={<Link href="/plan" />}>Planiraj putovanje</Button>
          }
        />
      </div>
    );
  }

  return <TripResultView trip={trip} />;
}
