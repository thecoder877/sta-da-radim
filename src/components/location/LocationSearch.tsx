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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const optionId = (index: number) => `${listId}-option-${index}`;
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
        setActiveIndex(-1);
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
    setActiveIndex(-1);
    setOpen(false);
    setStatus(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const canOpen = suggestions.length > 0;
    if (event.key === "ArrowDown") {
      if (!canOpen) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      if (!canOpen) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        choose(suggestions[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
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
          role="combobox"
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          className={inputClassName ?? "h-11 pr-11"}
          onKeyDown={handleKeyDown}
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
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.name}-${suggestion.coordinates.latitude}`} role="presentation">
              <button
                type="button"
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                  index === activeIndex ? "bg-muted" : ""
                }`}
                onMouseEnter={() => setActiveIndex(index)}
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
