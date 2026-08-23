"use client";

import { useEffect, useRef } from "react";
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
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) {
      return;
    }

    let cancelled = false;
    let map: import("mapbox-gl").Map | undefined;
    let popup: import("mapbox-gl").Popup | undefined;

    async function setup() {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = token as string;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [SERBIA_CENTER.longitude, SERBIA_CENTER.latitude],
        zoom: 6.2,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) {
          return;
        }

        const line =
          routeCoordinates && routeCoordinates.length > 1
            ? routeCoordinates
            : points.map((point) => point.coordinates);

        if (line.length > 1) {
          map.addSource("trip-route", {
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
          map.addLayer({
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

        const bounds = new mapboxgl.LngLatBounds();
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
              .addTo(map as import("mapbox-gl").Map);
          });

          new mapboxgl.Marker({ element: el })
            .setLngLat([point.coordinates.longitude, point.coordinates.latitude])
            .addTo(map as import("mapbox-gl").Map);
        });

        if (points.length > 0) {
          map.fitBounds(bounds, { padding: 64, maxZoom: 11, duration: 600 });
        }
      });

      popup = new mapboxgl.Popup({ offset: 16, closeButton: false });
    }

    void setup();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [token, points, selectedId, onSelect, routeCoordinates]);

  if (!token) {
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
