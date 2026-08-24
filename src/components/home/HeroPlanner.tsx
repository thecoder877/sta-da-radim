"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { DURATION_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSearch } from "@/components/location/LocationSearch";
import type { Coordinates } from "@/types/place";

export function HeroPlanner() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration] = useState("1");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({
      from,
      date,
      duration,
    });
    if (coordinates) {
      params.set("lat", String(coordinates.latitude));
      params.set("lng", String(coordinates.longitude));
    }
    router.push(`/plan?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-2xl border border-border bg-card p-4 text-left shadow-sm sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LocationSearch
          value={from}
          onChange={(name, nextCoordinates) => {
            setFrom(name);
            setCoordinates(nextCoordinates);
          }}
          inputClassName="h-10 bg-background pr-11 text-foreground"
        />
        <div className="space-y-1.5">
          <Label htmlFor="hero-date">Kada</Label>
          <Input
            id="hero-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="bg-background [color-scheme:light]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-duration">Trajanje</Label>
          <select
            id="hero-duration"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Napravi plan
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Prvi plan možeš da napraviš bez naloga.</p>
    </form>
  );
}
