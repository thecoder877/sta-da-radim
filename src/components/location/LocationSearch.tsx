"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Coordinates } from "@/types/place";

export interface LocationSuggestion {
  name: string;
  detail?: string;
  coordinates: Coordinates;
}

export function LocationSearch({
  value,
  onChange,
  label = "Odakle krećeš?",
  placeholder = "Unesi grad, selo ili adresu",
  error,
  autoDetect = true,
  inputClassName,
}: {
  value: string;
  onChange: (name: string, coordinates?: Coordinates) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  autoDetect?: boolean;
  inputClassName?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const skipSearch = useRef(false);
  const detectedOnce = useRef(false);

  useEffect(() => {
    if (!autoDetect || detectedOnce.current || value.trim()) {
      return;
    }
    detectedOnce.current = true;
    void detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetect]);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as { suggestions?: LocationSuggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [value]);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setStatus("Pregledač ne podržava lokaciju. Ukucaj mesto ručno.");
      return;
    }

    setDetecting(true);
    setStatus("Tražimo tvoju lokaciju...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          });
          const response = await fetch(`/api/geocode/reverse?${params.toString()}`);
          const data = (await response.json()) as { suggestion?: LocationSuggestion | null };
          const suggestion = data.suggestion;
          skipSearch.current = true;
          if (suggestion) {
            onChange(suggestion.name, suggestion.coordinates);
            setStatus(`Prepoznato: ${suggestion.name}`);
          } else {
            onChange("Moja lokacija", {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setStatus("Lokacija je uhvaćena. Možeš i da je preimenuješ.");
          }
        } catch {
          setStatus("Nismo uspeli da pročitamo adresu. Ukucaj mesto.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setStatus("Dozvoli lokaciju ili ukucaj mesto — predlozi se pojavljuju dok kucaš.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  function choose(suggestion: LocationSuggestion) {
    skipSearch.current = true;
    onChange(suggestion.name, suggestion.coordinates);
    setSuggestions([]);
    setOpen(false);
    setStatus(null);
  }

  return (
    <div className="relative space-y-1.5">
      {label ? <Label htmlFor="start-location">{label}</Label> : null}
      <div className="relative">
        <Input
          id="start-location"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-expanded={open}
          aria-controls={listId}
          className={inputClassName ?? "h-11 pr-11"}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 140);
          }}
          onChange={(event) => {
            setStatus(null);
            onChange(event.target.value);
          }}
        />
        <button
          type="button"
          onClick={() => void detectLocation()}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Koristi moju lokaciju"
        >
          {detecting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
        </button>
      </div>

      {open && value.trim().length >= 2 && suggestions.length > 0 ? (
        <ul
          id={listId}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.name}-${suggestion.coordinates.latitude}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(suggestion);
                }}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">{suggestion.name}</span>
                  {suggestion.detail ? (
                    <span className="block text-xs text-muted-foreground">
                      {suggestion.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searching ? (
        <p className="text-xs text-muted-foreground">Tražimo predloge...</p>
      ) : null}
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
