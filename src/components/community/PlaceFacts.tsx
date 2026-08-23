"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";
import type { Place } from "@/types/place";

function Fact({
  label,
  value,
  field,
  onSuggest,
}: {
  label: string;
  value?: string | number | boolean | null;
  field: string;
  onSuggest: (field: string) => void;
}) {
  const display =
    value === true ? "Da" : value === false ? "Ne" : value === 0 ? "0" : value ? String(value) : null;
  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {display ? (
        <p className="mt-1 text-sm font-medium">{display}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Nije poznato</p>
          <button type="button" className="mt-1 text-sm text-primary underline" onClick={() => onSuggest(field)}>
            + Dodaj {label.toLowerCase()}
          </button>
        </>
      )}
    </div>
  );
}

export function PlaceFacts({
  place,
  overlay,
  onSuggest,
}: {
  place: Place;
  overlay: {
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
  };
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

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl">Informacije</h2>
        <Button variant="outline" size="sm" onClick={() => suggest()}>
          Predloži izmenu
        </Button>
      </div>
      {overlay.lastVerifiedAt ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Potvrđeno {new Date(overlay.lastVerifiedAt).toLocaleDateString("sr-Latn")}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Fact label="Radno vreme" value={overlay.openingHours ?? place.openingHours} field="opening_hours" onSuggest={suggest} />
        <Fact label="Cena" value={overlay.priceInfo} field="price_info" onSuggest={suggest} />
        <Fact label="Telefon" value={overlay.phone} field="phone" onSuggest={suggest} />
        <Fact label="Website" value={overlay.website ?? place.website} field="website" onSuggest={suggest} />
        <Fact label="Adresa" value={overlay.address} field="address" onSuggest={suggest} />
        <Fact label="Parking" value={overlay.parkingInfo} field="parking_info" onSuggest={suggest} />
        <Fact
          label="Trajanje posete"
          value={overlay.estimatedDurationMinutes ?? place.estimatedDurationMinutes}
          field="estimated_duration_minutes"
          onSuggest={suggest}
        />
        <Fact label="Porodično" value={overlay.familyFriendly} field="family_friendly" onSuggest={suggest} />
        <Fact label="Pet friendly" value={overlay.petFriendly} field="pet_friendly" onSuggest={suggest} />
        <Fact label="Pristupačnost" value={overlay.accessibilityNotes} field="accessibility_notes" onSuggest={suggest} />
      </div>
    </section>
  );
}
