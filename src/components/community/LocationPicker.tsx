"use client";

import { useEffect, useRef } from "react";
import { SERBIA_CENTER } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

function pickerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "place-picker-marker",
    html: `<span style="
      display:block;width:22px;height:22px;border-radius:999px;
      border:2px solid #fff;background:#c45c26;
      box-shadow:0 2px 8px rgba(0,0,0,.28);
    "></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

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

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let observer: ResizeObserver | null = null;
    const start = value ?? SERBIA_CENTER;

    void import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current) {
        return;
      }
      const L = leaflet.default;
      if ("_leaflet_id" in containerRef.current) {
        delete (containerRef.current as HTMLDivElement & { _leaflet_id?: number })
          ._leaflet_id;
      }
      const instance = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
        [start.latitude, start.longitude],
        value ? 12 : 7,
      );
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(instance);

      let marker: import("leaflet").Marker | null = value
        ? L.marker([value.latitude, value.longitude], {
            draggable: true,
            icon: pickerIcon(L),
          }).addTo(instance)
        : null;

      function placeMarker(lat: number, lng: number) {
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng], { draggable: true, icon: pickerIcon(L) }).addTo(
            instance,
          );
          marker.on("dragend", () => {
            const next = marker?.getLatLng();
            if (next) {
              onChangeRef.current({ latitude: next.lat, longitude: next.lng });
            }
          });
        }
        onChangeRef.current({ latitude: lat, longitude: lng });
      }

      if (marker) {
        marker.on("dragend", () => {
          const next = marker?.getLatLng();
          if (next) {
            onChangeRef.current({ latitude: next.lat, longitude: next.lng });
          }
        });
      }

      instance.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        placeMarker(event.latlng.lat, event.latlng.lng);
      });

      map = instance;
      requestAnimationFrame(() => instance.invalidateSize());
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(containerRef.current);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
    };
    // Initialize once; later updates come from map events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={
        className ??
        "h-72 w-full overflow-hidden rounded-2xl bg-[#e7efe4] ring-1 ring-foreground/10"
      }
    >
      <div ref={containerRef} className="h-full min-h-[18rem] w-full" />
    </div>
  );
}
