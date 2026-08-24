"use client";

import { useMemo, useState } from "react";
import { TripMapLazy } from "@/components/map/TripMapLazy";
import { TripActions } from "@/components/trip/TripActions";
import { TripExport } from "@/components/trip/TripExport";
import { TripSummary } from "@/components/trip/TripSummary";
import { TripTimeline } from "@/components/trip/TripTimeline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveStartCoordinates } from "@/lib/locations";
import type { GeneratedTrip } from "@/types/trip";

export function TripResultView({
  trip,
  readOnly = false,
}: {
  trip: GeneratedTrip;
  readOnly?: boolean;
}) {
  const [currentTrip, setCurrentTrip] = useState(trip);
  const [selectedPlaceId, setSelectedPlaceId] = useState(trip.stops[0]?.placeId);
  const [mobileTab, setMobileTab] = useState("plan");

  const points = useMemo(() => {
    const startCoordinates =
      currentTrip.startCoordinates ?? resolveStartCoordinates(currentTrip.startLocation);
    const startPoint = startCoordinates
      ? [
          {
            id: "trip-start",
            name: `Polazak: ${currentTrip.startLocation}`,
            coordinates: startCoordinates,
            description: `Početak rute iz ${currentTrip.startLocation}.`,
            kind: "start" as const,
          },
        ]
      : [];

    return [
      ...startPoint,
      ...currentTrip.stops.map((stop) => ({
        id: stop.placeId,
        name: stop.place.name,
        coordinates: {
          latitude: stop.place.latitude,
          longitude: stop.place.longitude,
        },
        description: stop.place.shortDescription,
        kind: stop.kind === "lodging" ? ("lodging" as const) : ("stop" as const),
      })),
    ];
  }, [currentTrip]);

  function showOnMap(placeId: string) {
    setSelectedPlaceId(placeId);
    setMobileTab("map");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="sticky top-16 z-30 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">{currentTrip.startLocation}</p>
            <p className="font-heading text-lg leading-tight">{currentTrip.title}</p>
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
            <TripSummary trip={currentTrip} />
            <TripTimeline
              trip={currentTrip}
              selectedPlaceId={selectedPlaceId}
              onShowOnMap={showOnMap}
            />
            <TripExport trip={currentTrip} />
            {readOnly ? null : <TripActions trip={currentTrip} onTripChange={setCurrentTrip} />}
          </div>
        ) : (
          <div className="h-[calc(100vh-8.5rem)]">
            <TripMapLazy
              points={points}
              selectedId={selectedPlaceId}
              onSelect={setSelectedPlaceId}
              routeCoordinates={currentTrip.routeCoordinates}
              transport={currentTrip.transport}
              className="h-full"
            />
          </div>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-[45%_55%]">
        <div className="space-y-6 px-6 py-8 lg:px-10">
          <TripSummary trip={currentTrip} />
          <TripTimeline
            trip={currentTrip}
            selectedPlaceId={selectedPlaceId}
            onShowOnMap={setSelectedPlaceId}
          />
          <TripExport trip={currentTrip} />
          {readOnly ? null : <TripActions trip={currentTrip} onTripChange={setCurrentTrip} />}
        </div>
        <div className="relative sticky top-16 h-[calc(100vh-4rem)] p-4">
          <p className="pointer-events-none absolute bottom-8 left-8 z-10 rounded-full bg-card/95 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            A polazak · broj stanica · H noćenje
          </p>
          <TripMapLazy
            points={points}
            selectedId={selectedPlaceId}
            onSelect={setSelectedPlaceId}
            routeCoordinates={currentTrip.routeCoordinates}
            transport={currentTrip.transport}
            className="h-full overflow-hidden rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
