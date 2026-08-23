"use client";

import { LocationSearch } from "@/components/location/LocationSearch";
import type { Coordinates } from "@/types/place";

export function StartLocationField({
  value,
  onChange,
  error,
  autoDetect = true,
}: {
  value: string;
  onChange: (name: string, coordinates?: Coordinates) => void;
  error?: string;
  autoDetect?: boolean;
}) {
  return (
    <LocationSearch
      value={value}
      onChange={onChange}
      error={error}
      autoDetect={autoDetect}
    />
  );
}
