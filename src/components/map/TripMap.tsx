"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleTripMap } from "@/components/map/GoogleTripMap";
import { LeafletTripMap } from "@/components/map/LeafletTripMap";
import type { MapPoint } from "@/components/map/mapTypes";
import type { Coordinates } from "@/types/place";
import type { TransportType } from "@/types/trip";

export type { MapPoint } from "@/components/map/mapTypes";

function downsampleRoute(points: Coordinates[], maxPoints = 240): Coordinates[] {
  if (points.length <= maxPoints) {
    return points;
  }
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

interface TripMapProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  routeCoordinates?: Coordinates[];
  transport?: TransportType;
  className?: string;
}

export function TripMap({
  points,
  selectedId,
  onSelect,
  routeCoordinates,
  transport = "car",
  className,
}: TripMapProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [fetchedRoute, setFetchedRoute] = useState<Coordinates[] | undefined>();

  const line = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      return downsampleRoute(routeCoordinates);
    }
    if (fetchedRoute && fetchedRoute.length > 1) {
      return downsampleRoute(fetchedRoute);
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
        transport,
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
  }, [points, routeCoordinates, transport]);

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
