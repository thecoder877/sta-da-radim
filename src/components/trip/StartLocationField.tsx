"use client";

import { useMemo, useState } from "react";
import { suggestStartCities } from "@/lib/locations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StartLocationField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (name: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => suggestStartCities(value), [value]);

  return (
    <div className="relative space-y-1.5">
      <Label htmlFor="start-location">Odakle krećeš?</Label>
      <Input
        id="start-location"
        value={value}
        placeholder="Ruma"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-expanded={open}
        aria-controls="start-location-list"
        className="h-11"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => onChange(event.target.value)}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id="start-location-list"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {suggestions.map((city) => (
            <li key={city.name}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(city.name);
                  setOpen(false);
                }}
              >
                {city.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
