"use client";

import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/components/map/mapTypes";
import type { Coordinates } from "@/types/place";
import { MAP_COLORS } from "@/lib/theme";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
        Marker: new (opts: Record<string, unknown>) => GoogleMarker;
        Polyline: new (opts: Record<string, unknown>) => { setMap: (map: GoogleMap | null) => void };
        LatLngBounds: new () => GoogleBounds;
      };
    };
    __staDaRadimGoogleMaps?: Promise<void>;
  }
}

interface GoogleMap {
  fitBounds: (bounds: GoogleBounds, padding?: number) => void;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (name: string, handler: () => void) => void;
}

interface GoogleBounds {
  extend: (pos: { lat: number; lng: number }) => void;
}

function loadGoogleMaps(key: string): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }
  if (!window.__staDaRadimGoogleMaps) {
    window.__staDaRadimGoogleMaps = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("GOOGLE_MAPS_LOAD_FAILED"));
      document.head.appendChild(script);
    });
  }
  return window.__staDaRadimGoogleMaps;
}

function pinLabel(point: MapPoint, index: number): string {
  if (point.kind === "start") {
    return "A";
  }
  if (point.kind === "lodging") {
    return "H";
  }
  return String(index);
}

export function GoogleTripMap({
  apiKey,
  points,
  selectedId,
  onSelect,
  routeCoordinates,
  className,
}: {
  apiKey: string;
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  routeCoordinates?: Coordinates[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const lineRef = useRef<{ setMap: (map: GoogleMap | null) => void } | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current) {
        return;
      }
      try {
        await loadGoogleMaps(apiKey);
      } catch {
        return;
      }
      if (cancelled || !containerRef.current || !window.google?.maps) {
        return;
      }

      const center = points[0]?.coordinates ?? { latitude: 44.2, longitude: 20.8 };
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setReady(true);
    }

    void setup();
    return () => {
      cancelled = true;
    };
    // Map instance is created once per key/container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!ready || !map || !maps) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    lineRef.current?.setMap(null);

    const bounds = new maps.LatLngBounds();
    let stopNumber = 0;

    points.forEach((point) => {
      if (point.kind === "stop" || !point.kind) {
        stopNumber += 1;
      }
      const marker = new maps.Marker({
        map,
        position: { lat: point.coordinates.latitude, lng: point.coordinates.longitude },
        title: point.name,
        label: {
          text: pinLabel(point, stopNumber),
          color: "white",
          fontWeight: "700",
        },
        opacity: point.id === selectedId ? 1 : 0.92,
      });
      marker.addListener("click", () => onSelectRef.current?.(point.id));
      markersRef.current.push(marker);
      bounds.extend({ lat: point.coordinates.latitude, lng: point.coordinates.longitude });
    });

    const line =
      routeCoordinates && routeCoordinates.length > 1
        ? routeCoordinates
        : points.map((point) => point.coordinates);

    if (line.length > 1) {
      lineRef.current = new maps.Polyline({
        path: line.map((point) => ({ lat: point.latitude, lng: point.longitude })),
        strokeColor: MAP_COLORS.route,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
    }

    if (points.length > 0) {
      map.fitBounds(bounds, 72);
    }
  }, [points, routeCoordinates, selectedId, ready]);

  return <div ref={containerRef} className={className ?? "h-full min-h-[320px]"} />;
}
