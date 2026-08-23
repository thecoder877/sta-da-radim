"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Share2 } from "lucide-react";
import { TripMapLazy } from "@/components/map/TripMapLazy";
import { TripSummary } from "@/components/trip/TripSummary";
import { TripTimeline } from "@/components/trip/TripTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GeneratedTrip } from "@/types/trip";

export function TripResultView({ trip }: { trip: GeneratedTrip }) {
  const [selectedPlaceId, setSelectedPlaceId] = useState(trip.stops[0]?.placeId);
  const [mobileTab, setMobileTab] = useState("plan");

  const points = useMemo(
    () =>
      trip.stops.map((stop) => ({
        id: stop.placeId,
        name: stop.place.name,
        coordinates: {
          latitude: stop.place.latitude,
          longitude: stop.place.longitude,
        },
        description: stop.place.shortDescription,
      })),
    [trip.stops],
  );

  function showOnMap(placeId: string) {
    setSelectedPlaceId(placeId);
    setMobileTab("map");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="sticky top-16 z-30 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">{trip.startLocation}</p>
            <p className="font-heading text-lg leading-tight">{trip.title}</p>
          </div>
          <Tabs value={mobileTab} onValueChange={setMobileTab}>
            <TabsList>
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="map">Mapa</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="md:hidden">
        {mobileTab === "plan" ? (
          <div className="space-y-6 px-4 py-6">
            <TripSummary trip={trip} />
            <TripTimeline
              trip={trip}
              selectedPlaceId={selectedPlaceId}
              onShowOnMap={showOnMap}
            />
            <TripActions />
          </div>
        ) : (
          <div className="h-[calc(100vh-8.5rem)]">
            <TripMapLazy
              points={points}
              selectedId={selectedPlaceId}
              onSelect={setSelectedPlaceId}
              className="h-full"
            />
          </div>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-[45%_55%]">
        <div className="space-y-6 px-6 py-8 lg:px-10">
          <TripSummary trip={trip} />
          <TripTimeline
            trip={trip}
            selectedPlaceId={selectedPlaceId}
            onShowOnMap={setSelectedPlaceId}
          />
          <TripActions />
        </div>
        <div className="sticky top-16 h-[calc(100vh-4rem)] p-4">
          <TripMapLazy
            points={points}
            selectedId={selectedPlaceId}
            onSelect={setSelectedPlaceId}
            className="h-full overflow-hidden rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

function TripActions() {
  return (
    <div className="flex flex-wrap gap-2 pb-8">
      <Button variant="outline" render={<Link href="/login" />}>
        <Bookmark data-icon="inline-start" />
        Sačuvaj
      </Button>
      <Button variant="outline" disabled>
        <Share2 data-icon="inline-start" />
        Podeli
      </Button>
      <Button variant="ghost" render={<Link href="/plan" />}>
        Izmeni plan
      </Button>
    </div>
  );
}
