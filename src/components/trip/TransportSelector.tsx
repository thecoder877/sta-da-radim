"use client";

import { Bike, Bus, Car, Footprints, Train } from "lucide-react";
import { TRANSPORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TransportType } from "@/types/trip";

const icons = {
  car: Car,
  bus: Bus,
  train: Train,
  walk: Footprints,
  bike: Bike,
};

export function TransportSelector({
  value,
  onChange,
}: {
  value: TransportType;
  onChange: (value: TransportType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {TRANSPORT_OPTIONS.map((option) => {
        const Icon = icons[option.id];
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition",
              selected
                ? "border-primary bg-primary/8 text-foreground"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
