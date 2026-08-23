"use client";

import { useEffect, useRef } from "react";
import { SERBIA_CENTER } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value?: Coordinates;
  onChange: (coordinates: Coordinates) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    let cancelled = false;
    let map: { remove: () => void } | null = null;
    const start = value ?? SERBIA_CENTER;

    void import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current) {
        return;
      }
      const L = leaflet.default;
      const instance = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
        [start.latitude, start.longitude],
        value ? 12 : 7,
      );
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(instance);
      const marker = L.marker([start.latitude, start.longitude], { draggable: true }).addTo(instance);
      marker.on("dragend", () => {
        const next = marker.getLatLng();
        onChangeRef.current({ latitude: next.lat, longitude: next.lng });
      });
      instance.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(event.latlng);
        onChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
      map = instance;
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // Initialize once; later updates come from map events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className ?? "h-72 w-full overflow-hidden rounded-2xl"} />;
}
