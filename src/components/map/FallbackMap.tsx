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
  return { x: Math.min(94, Math.max(6, x)), y: Math.min(94, Math.max(6, y)) };
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
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl bg-[#d7e3d4]">
      <svg
        viewBox="0 0 200 240"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <path
          d="M42 28 L88 18 L118 22 L148 38 L168 72 L176 108 L162 148 L154 188 L132 214 L98 226 L62 210 L38 176 L28 132 L22 88 Z"
          fill="#b7c9a8"
          stroke="#7f9272"
          strokeWidth="2"
        />
        <path
          d="M28 86 C62 78, 96 92, 132 86 C150 98, 168 108, 176 108"
          fill="none"
          stroke="#6b8ea8"
          strokeWidth="3"
        />
        {points.length > 1 ? (
          <polyline
            fill="none"
            stroke="#c45c26"
            strokeWidth="2.5"
            strokeLinejoin="round"
            points={points
              .map((point) => {
                const position = project(point.coordinates);
                return `${(position.x / 100) * 200},${(position.y / 100) * 240}`;
              })
              .join(" ")}
          />
        ) : null}
      </svg>
      <p className="absolute top-3 left-3 z-10 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
        Mapa Srbije
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
