"use client";

import { SERBIA_BOUNDS } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

function project(point: Coordinates) {
  const x =
    ((point.longitude - SERBIA_BOUNDS.west) /
      (SERBIA_BOUNDS.east - SERBIA_BOUNDS.west)) *
    100;
  const y =
    ((SERBIA_BOUNDS.north - point.latitude) /
      (SERBIA_BOUNDS.north - SERBIA_BOUNDS.south)) *
    100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) };
}

export function FallbackMap({
  points,
  selectedId,
  onSelect,
}: {
  points: Array<{ id: string; name: string; coordinates: Coordinates }>;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl bg-[#d8c9a8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(90,120,70,0.18),transparent_45%)]" />
      <p className="absolute top-3 left-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground">
        Mapa Srbije · dodaj Mapbox token za satelitski prikaz
      </p>
      {points.map((point, index) => {
        const position = project(point.coordinates);
        const selected = point.id === selectedId;
        return (
          <button
            key={point.id}
            type="button"
            title={point.name}
            onClick={() => onSelect?.(point.id)}
            className={`absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-medium shadow ${
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background"
            }`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
