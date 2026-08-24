"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_REGIONS } from "@/data/mockPlaces";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    params.delete("page");
    router.push(`/explore?${params.toString()}`);
  }

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") {
      params.delete(key);
    } else {
      params.set(key, "1");
    }
    params.delete("page");
    router.push(`/explore?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="explore-search">Pretraga</Label>
        <Input
          id="explore-search"
          value={query}
          placeholder="Ruma, Beograd, bazen, manastir..."
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Kategorija</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update("category", "")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              !activeCategory ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            Sve
          </button>
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => update("category", activeCategory === category ? "" : category)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                activeCategory === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="region">Region</Label>
        <select
          id="region"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
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

      <details className="rounded-xl border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-medium">Još filtera</summary>
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Dodatni filteri</legend>
          {[
            ["free", "Besplatno"],
            ["paid", "Plaća se ulaz"],
            ["outdoor", "Na otvorenom"],
            ["indoor", "U zatvorenom"],
            ["children", "Za decu"],
            ["romantic", "Romantično"],
            ["hidden", "Skrivena mesta"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={searchParams.get(key) === "1"}
                onChange={() => toggle(key)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </details>
    </div>
  );
}
