"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleTripMap } from "@/components/map/GoogleTripMap";
import { LeafletTripMap } from "@/components/map/LeafletTripMap";
import type { MapPoint } from "@/components/map/mapTypes";
import type { Coordinates } from "@/types/place";

export type { MapPoint } from "@/components/map/mapTypes";

interface TripMapProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  routeCoordinates?: Coordinates[];
  className?: string;
}

export function TripMap({
  points,
  selectedId,
  onSelect,
  routeCoordinates,
  className,
}: TripMapProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [fetchedRoute, setFetchedRoute] = useState<Coordinates[] | undefined>();

  const line = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      return routeCoordinates;
    }
    if (fetchedRoute && fetchedRoute.length > 1) {
      return fetchedRoute;
    }
    return points.map((point) => point.coordinates);
  }, [routeCoordinates, fetchedRoute, points]);

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      return;
    }
    if (points.length < 2) {
      return;
    }

    const controller = new AbortController();
    void fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: points.map((point) => point.coordinates),
        transport: "car",
      }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { route?: { coordinates?: Coordinates[] } }) => {
        if (data.route?.coordinates && data.route.coordinates.length > 1) {
          setFetchedRoute(data.route.coordinates);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [points, routeCoordinates]);

  if (googleKey) {
    return (
      <GoogleTripMap
        apiKey={googleKey}
        points={points}
        selectedId={selectedId}
        onSelect={onSelect}
        routeCoordinates={line}
        className={className}
      />
    );
  }

  return (
    <LeafletTripMap
      points={points}
      selectedId={selectedId}
      onSelect={onSelect}
      routeCoordinates={line}
      className={className}
    />
  );
}
