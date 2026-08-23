"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { GoogleTripMap } from "@/components/map/GoogleTripMap";
import { FallbackMap } from "@/components/map/FallbackMap";
import type { MapPoint } from "@/components/map/mapTypes";
import { SERBIA_CENTER } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

export type { MapPoint } from "@/components/map/mapTypes";

interface TripMapProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  routeCoordinates?: Coordinates[];
  className?: string;
}

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

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

export function TripMap({
  points,
  selectedId,
  onSelect,
  routeCoordinates,
  className,
}: TripMapProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [fetchedRoute, setFetchedRoute] = useState<Coordinates[] | undefined>();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

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

  useEffect(() => {
    if (googleKey || failed || !containerRef.current) {
      return;
    }

    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;

    async function setup() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) {
        return;
      }

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [SERBIA_CENTER.longitude, SERBIA_CENTER.latitude],
        zoom: 6.4,
      });
      map = instance;
      mapRef.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      instance.on("error", (event) => {
        const message = String(event.error ?? "");
        if (message.includes("openfreemap") || message.includes("style")) {
          try {
            instance.setStyle(RASTER_STYLE);
          } catch {
            if (!cancelled) {
              setFailed(true);
            }
          }
        }
      });

      instance.on("load", () => {
        if (cancelled) {
          return;
        }
        instance.resize();
        setReady(true);
      });
    }

    void setup();

    return () => {
      cancelled = true;
      setReady(false);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [failed, googleKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || failed) {
      return;
    }

    const source = map.getSource("trip-route") as
      | { setData: (data: unknown) => void }
      | undefined;
    const data = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: line.map((point) => [point.longitude, point.latitude]),
      },
    };

    if (line.length > 1) {
      if (source) {
        source.setData(data);
      } else {
        map.addSource("trip-route", { type: "geojson", data });
        map.addLayer({
          id: "trip-route-casing",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#fff7ed",
            "line-width": 7,
            "line-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "trip-route-line",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#c45c26",
            "line-width": 4,
            "line-opacity": 0.95,
          },
        });
      }
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    void import("maplibre-gl").then((maplibregl) => {
      const bounds = new maplibregl.LngLatBounds();
      let stopNumber = 0;

      points.forEach((point) => {
        if (point.kind === "stop" || !point.kind) {
          stopNumber += 1;
        }
        const el = document.createElement("button");
        el.type = "button";
        el.className = "trip-map-marker";
        el.textContent = pinText(point, stopNumber);
        el.setAttribute("aria-label", point.name);
        el.style.cssText = [
          "width:30px",
          "height:30px",
          "border-radius:999px",
          "border:2px solid #fff",
          `background:${pinBackground(point, point.id === selectedId)}`,
          "color:#fff",
          "font-size:12px",
          "font-weight:700",
          "cursor:pointer",
          "box-shadow:0 2px 8px rgba(0,0,0,.28)",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "padding:0",
        ].join(";");
        el.addEventListener("click", () => onSelectRef.current?.(point.id));

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([point.coordinates.longitude, point.coordinates.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<strong>${point.name}</strong>${
                point.description ? `<div>${point.description}</div>` : ""
              }`,
            ),
          )
          .addTo(map);

        markersRef.current.push(marker);
        bounds.extend([point.coordinates.longitude, point.coordinates.latitude]);
      });

      if (points.length === 1) {
        map.easeTo({
          center: [points[0].coordinates.longitude, points[0].coordinates.latitude],
          zoom: 11,
          duration: 400,
        });
      } else if (points.length > 1) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 500 });
      }
      map.resize();
    });
  }, [ready, failed, points, selectedId, line]);

  useEffect(() => {
    const map = mapRef.current;
    const node = containerRef.current;
    if (!map || !node) {
      return;
    }
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

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

  if (failed) {
    return (
      <div className={className}>
        <FallbackMap points={points} selectedId={selectedId} onSelect={onSelect} />
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-full min-h-[320px]"} />;
}
