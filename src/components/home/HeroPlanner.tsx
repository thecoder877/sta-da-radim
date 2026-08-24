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
      className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-left text-foreground shadow-lg ring-1 ring-foreground/15 sm:grid-cols-2 lg:grid-cols-4"
    >
      <LocationSearch
        value={from}
        onChange={(name, nextCoordinates) => {
          setFrom(name);
          setCoordinates(nextCoordinates);
        }}
        inputClassName="h-10 bg-background pr-11 text-foreground"
      />
      <div className="space-y-1.5">
        <Label htmlFor="hero-date" className="text-foreground">
          Kada ideš?
        </Label>
        <Input
          id="hero-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-10 bg-background text-foreground [color-scheme:light]"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero-duration" className="text-foreground">
          Koliko dugo?
        </Label>
        <select
          id="hero-duration"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground"
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="h-10 w-full">
          Nastavi plan
        </Button>
      </div>
    </form>
  );
}
