"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { InfoRow } from "@/components/layout/InfoRow";
import { Button } from "@/components/ui/button";
import { formatDurationMinutes } from "@/lib/format";
import { resolvePlacePrice } from "@/lib/places/price";
import type { Place } from "@/types/place";

export interface PlaceFactsOverlay {
  address?: string | null;
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  priceInfo?: string | null;
  parkingInfo?: string | null;
  estimatedDurationMinutes?: number | null;
  familyFriendly?: boolean | null;
  petFriendly?: boolean | null;
  accessibilityNotes?: string | null;
  lastVerifiedAt?: string | null;
}

function displayValue(value?: string | number | boolean | null): string | null {
  if (value === true) {
    return "Da";
  }
  if (value === false) {
    return "Ne";
  }
  if (value === 0) {
    return "0";
  }
  return value ? String(value) : null;
}

export function PlaceFacts({
  place,
  overlay,
  onSuggest,
}: {
  place: Place;
  overlay: PlaceFactsOverlay;
  onSuggest: (field?: string) => void;
}) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  function suggest(field?: string) {
    if (!user) {
      openAuthModal({
        reason: "community",
        pendingAction: { type: "community", href: `/place/${place.slug}?edit=${field ?? "opening_hours"}` },
      });
      return;
    }
    onSuggest(field);
  }

  const durationSource = overlay.estimatedDurationMinutes ?? place.estimatedDurationMinutes;
  const rows = [
    { label: "Radno vreme", value: overlay.openingHours ?? place.openingHours, field: "opening_hours" },
    { label: "Cena", value: resolvePlacePrice(place, overlay), field: "price_info" },
    { label: "Adresa", value: overlay.address, field: "address" },
    { label: "Telefon", value: overlay.phone, field: "phone" },
    { label: "Website", value: overlay.website ?? place.website, field: "website" },
    { label: "Parking", value: overlay.parkingInfo, field: "parking_info" },
    {
      label: "Trajanje",
      value: durationSource ? formatDurationMinutes(durationSource) : null,
      field: "estimated_duration_minutes",
    },
    { label: "Porodično", value: overlay.familyFriendly, field: "family_friendly" },
    { label: "Pet friendly", value: overlay.petFriendly, field: "pet_friendly" },
    { label: "Pristupačnost", value: overlay.accessibilityNotes, field: "accessibility_notes" },
  ];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Informacije</h2>
        <Button variant="outline" size="sm" onClick={() => suggest()}>
          Predloži izmenu
        </Button>
      </div>
      {overlay.lastVerifiedAt ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Potvrđeno {new Date(overlay.lastVerifiedAt).toLocaleDateString("sr-Latn")}
        </p>
      ) : null}
      <dl className="mt-2">
        {rows.map((row) => {
          const value = displayValue(row.value);
          return (
            <InfoRow
              key={row.field}
              label={row.label}
              value={value}
              action={
                value ? null : (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => suggest(row.field)}
                  >
                    Dodaj informaciju
                  </button>
                )
              }
            />
          );
        })}
      </dl>
    </section>
  );
}
