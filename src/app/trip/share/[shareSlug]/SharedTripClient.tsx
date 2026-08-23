"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSharedTrip } from "@/lib/trips/clientApi";
import { TripResultView } from "@/components/trip/TripResultView";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import type { GeneratedTrip } from "@/types/trip";

export function SharedTripClient({
  slug,
  initialTrip,
}: {
  slug: string;
  initialTrip?: GeneratedTrip | null;
}) {
  const [trip, setTrip] = useState<GeneratedTrip | null>(initialTrip ?? null);
  const [ready, setReady] = useState(Boolean(initialTrip));

  useEffect(() => {
    if (initialTrip) {
      return;
    }
    let cancelled = false;
    void fetchSharedTrip(slug).then((found) => {
      if (!cancelled) {
        setTrip(found);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialTrip, slug]);

  if (!ready) {
    return <LoadingState message="Otvaramo deljeni plan..." />;
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Ovaj plan više nije javan"
          description="Link za deljenje je isključen ili putovanje ne postoji."
          action={<Button render={<Link href="/explore" />}>Istraži mesta</Button>}
        />
      </div>
    );
  }

  return <TripResultView trip={trip} readOnly />;
}
