"use client";

import { useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { googleMapsDirectionsUrl } from "@/lib/trips/googleMapsUrl";
import type { GeneratedTrip } from "@/types/trip";
import { Button } from "@/components/ui/button";

export function TripExport({ trip }: { trip: GeneratedTrip }) {
  const [message, setMessage] = useState<string | null>(null);
  const mapsUrl = googleMapsDirectionsUrl(trip);

  if (!mapsUrl) {
    return null;
  }
  const link = mapsUrl;

  async function copyLink() {
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setMessage("Google Maps link je kopiran.");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          render={<a href={link} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink data-icon="inline-start" />
          Otvori u Google Maps
        </Button>
        <Button variant="ghost" onClick={() => void copyLink()}>
          <Link2 data-icon="inline-start" />
          Kopiraj rutu
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
