"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_REGIONS } from "@/data/mockPlaces";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORY_FILTERS = [
  "Priroda",
  "Istorija",
  "Hrana",
  "Avantura",
  "Wellness",
];

export function PlaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query === current) {
        return;
      }
      update("q", query);
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/explore?${params.toString()}`);
  }

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") {
      params.delete(key);
    } else {
      params.set(key, "1");
    }
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <div className="space-y-5 rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
      <div className="space-y-1.5">
        <Label htmlFor="explore-search">Pretraga</Label>
        <Input
          id="explore-search"
          value={query}
          placeholder="Tara, manastir, jezero..."
          className="h-10"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Kategorija</Label>
        <select
          id="category"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={searchParams.get("category") ?? ""}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="">Sve kategorije</option>
          {CATEGORY_FILTERS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="region">Region</Label>
        <select
          id="region"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={searchParams.get("region") ?? ""}
          onChange={(event) => update("region", event.target.value)}
        >
          <option value="">Svi regioni</option>
          {MOCK_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Dodatni filteri</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("free") === "1"}
            onChange={() => toggle("free")}
          />
          Besplatno
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("paid") === "1"}
            onChange={() => toggle("paid")}
          />
          Plaća se ulaz
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("outdoor") === "1"}
            onChange={() => toggle("outdoor")}
          />
          Na otvorenom
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("indoor") === "1"}
            onChange={() => toggle("indoor")}
          />
          U zatvorenom
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("children") === "1"}
            onChange={() => toggle("children")}
          />
          Za decu
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("romantic") === "1"}
            onChange={() => toggle("romantic")}
          />
          Romantično
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("hidden") === "1"}
            onChange={() => toggle("hidden")}
          />
          Skrivena mesta
        </label>
      </fieldset>
    </div>
  );
}
