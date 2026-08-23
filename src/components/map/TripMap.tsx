"use client";

import { useEffect, useRef, useState } from "react";
import { SERBIA_CENTER } from "@/lib/constants";
import { FallbackMap } from "@/components/map/FallbackMap";
import type { Coordinates } from "@/types/place";

export interface MapPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  description?: string;
}

interface TripMapProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /**
   * Optional GeoJSON LineString coordinates for a real route.
   * Until routing is connected, straight lines are drawn between stops.
   */
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || failed) {
      return;
    }

    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    let popup: import("maplibre-gl").Popup | undefined;

    async function setup() {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) {
        return;
      }

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [SERBIA_CENTER.longitude, SERBIA_CENTER.latitude],
        zoom: 6.2,
      });
      map = instance;

      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      instance.on("error", () => {
        if (!cancelled && !instance.loaded()) {
          setFailed(true);
        }
      });

      instance.on("load", () => {

        const line =
          routeCoordinates && routeCoordinates.length > 1
            ? routeCoordinates
            : points.map((point) => point.coordinates);

        if (line.length > 1) {
          instance.addSource("trip-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: line.map((point) => [point.longitude, point.latitude]),
              },
            },
          });
          instance.addLayer({
            id: "trip-route-line",
            type: "line",
            source: "trip-route",
            paint: {
              "line-color": "#c45c26",
              "line-width": 3,
              "line-opacity": 0.8,
            },
          });
        }

        const bounds = new maplibregl.LngLatBounds();
        points.forEach((point, index) => {
          bounds.extend([point.coordinates.longitude, point.coordinates.latitude]);
          const el = document.createElement("button");
          el.type = "button";
          el.className = "trip-map-marker";
          el.textContent = String(index + 1);
          el.setAttribute("aria-label", point.name);
          el.style.cssText = [
            "width:28px",
            "height:28px",
            "border-radius:999px",
            "border:2px solid white",
            "background:#2c2416",
            "color:white",
            "font-size:12px",
            "font-weight:600",
            "cursor:pointer",
            "box-shadow:0 2px 8px rgba(0,0,0,.25)",
          ].join(";");

          if (point.id === selectedId) {
            el.style.background = "#c45c26";
          }

          el.addEventListener("click", () => {
            onSelect?.(point.id);
            popup
              ?.setLngLat([point.coordinates.longitude, point.coordinates.latitude])
              .setHTML(
                `<strong>${point.name}</strong>${
                  point.description ? `<div>${point.description}</div>` : ""
                }`,
              )
              .addTo(instance);
          });

          new maplibregl.Marker({ element: el })
            .setLngLat([point.coordinates.longitude, point.coordinates.latitude])
            .addTo(instance);
        });

        if (points.length > 0) {
          instance.fitBounds(bounds, { padding: 64, maxZoom: 11, duration: 600 });
        }
      });

      popup = new maplibregl.Popup({ offset: 16, closeButton: false });
    }

    void setup();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [failed, points, selectedId, onSelect, routeCoordinates]);

  if (failed) {
    return (
      <div className={className}>
        <FallbackMap
          points={points}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-full min-h-[320px]"} />;
}
