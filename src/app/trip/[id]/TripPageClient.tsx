"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEMO_TRIP } from "@/data/demoTrip";
import { fetchPersistedTrip } from "@/lib/trips/clientApi";
import { isUuid } from "@/lib/trips/ids";
import { persistGeneratedTrip, readGeneratedTrip } from "@/lib/trips/storage";
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
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = readGeneratedTrip(id);
      if (local && !cancelled) {
        setTrip(local);
        setReady(true);
      }

      if (isUuid(id)) {
        try {
          const persisted = await fetchPersistedTrip(id);
          if (cancelled) {
            return;
          }
          if (persisted) {
            persistGeneratedTrip(persisted);
            setTrip(persisted);
          } else if (!local) {
            setForbidden(true);
          }
        } catch {
          if (!local && !cancelled) {
            setForbidden(true);
          }
        }
      } else if (!local) {
        setForbidden(true);
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!ready) {
    return <LoadingState message="Otvaramo tvoj plan..." />;
  }

  if (!trip || forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Putovanje nije pronađeno"
          description="Ovaj plan nije dostupan. Ako je bio privremen, napravi novi. Ako je sačuvan, prijavi se nalogom koji ga poseduje."
          action={<Button render={<Link href="/plan" />}>Planiraj putovanje</Button>}
        />
      </div>
    );
  }

  return <TripResultView trip={trip} />;
}
