"use client";

import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/components/map/mapTypes";
import { escapeHtml } from "@/lib/security/escapeHtml";
import { SERBIA_CENTER } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

function pinBackground(point: MapPoint, selected: boolean): string {
  if (selected) {
    return "#c45c26";
  }
  if (point.kind === "start") {
    return "#2c6e4f";
  }
  if (point.kind === "lodging") {
    return "#5b4b8a";
  }
  return "#2c2416";
}

function pinText(point: MapPoint, stopNumber: number): string {
  if (point.kind === "start") {
    return "A";
  }
  if (point.kind === "lodging") {
    return "H";
  }
  return String(stopNumber);
}

function markerHtml(point: MapPoint, stopNumber: number, selected: boolean): string {
  return `<button type="button" aria-label="${point.name}" style="
    width:30px;height:30px;border-radius:999px;border:2px solid #fff;
    background:${pinBackground(point, selected)};color:#fff;font-size:12px;font-weight:700;
    cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.28);display:flex;align-items:center;
    justify-content:center;padding:0;line-height:1;
  ">${pinText(point, stopNumber)}</button>`;
}

export function LeafletTripMap({
  points,
  selectedId,
  onSelect,
  routeCoordinates,
  className,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  routeCoordinates?: Coordinates[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    async function setup() {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) {
        return;
      }

      const center = points[0]?.coordinates ?? SERBIA_CENTER;
      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([center.latitude, center.longitude], 8);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map?.invalidateSize());
    }

    void setup();

    return () => {
      cancelled = true;
      setReady(false);
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Created once; points are applied in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!ready || !map || !group) {
      return;
    }

    void import("leaflet").then(({ default: L }) => {
      group.clearLayers();

      const line =
        routeCoordinates && routeCoordinates.length > 1
          ? routeCoordinates
          : points.map((point) => point.coordinates);

      if (line.length > 1) {
        L.polyline(
          line.map((point) => [point.latitude, point.longitude] as [number, number]),
          { color: "#c45c26", weight: 4, opacity: 0.92 },
        ).addTo(group);
      }

      let stopNumber = 0;

      points.forEach((point) => {
        if (point.kind === "stop" || !point.kind) {
          stopNumber += 1;
        }
        const marker = L.marker([point.coordinates.latitude, point.coordinates.longitude], {
          icon: L.divIcon({
            className: "trip-leaflet-marker",
            html: markerHtml(point, stopNumber, point.id === selectedId),
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
          title: point.name,
        });
        marker.on("click", () => onSelectRef.current?.(point.id));
        marker.bindPopup(
          `<strong>${escapeHtml(point.name)}</strong>${point.description ? `<div>${escapeHtml(point.description)}</div>` : ""}`,
        );
        marker.addTo(group);
      });

      if (points.length === 1) {
        map.setView([points[0].coordinates.latitude, points[0].coordinates.longitude], 11);
      } else if (points.length > 1) {
        const bounds = L.latLngBounds(
          points.map((point) => [point.coordinates.latitude, point.coordinates.longitude]),
        );
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12 });
      }
      map.invalidateSize();
    });
  }, [ready, points, selectedId, routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    const node = containerRef.current;
    if (!ready || !map || !node) {
      return;
    }
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

  return <div ref={containerRef} className={className ?? "h-full min-h-[320px]"} />;
}
