"use client";

import { useEffect, useState } from "react";
import { EDITABLE_PLACE_FIELDS } from "@/lib/community/constants";
import { formatDurationMinutes } from "@/lib/format";
import { resolvePlacePrice } from "@/lib/places/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Place } from "@/types/place";
import type { PlaceFactsOverlay } from "@/components/community/PlaceFacts";

function currentValues(place: Place, overlay: PlaceFactsOverlay): Record<string, string> {
  return {
    opening_hours: overlay.openingHours ?? place.openingHours ?? "",
    phone: overlay.phone ?? "",
    website: overlay.website ?? place.website ?? "",
    instagram: overlay.instagram ?? "",
    facebook: overlay.facebook ?? "",
    address: overlay.address ?? "",
    price_info: overlay.priceInfo ?? resolvePlacePrice(place) ?? "",
    parking_info: overlay.parkingInfo ?? "",
    estimated_duration_minutes: String(
      overlay.estimatedDurationMinutes ?? place.estimatedDurationMinutes ?? "",
    ),
    description: place.description ?? "",
    short_description: place.shortDescription ?? "",
    category: place.category ?? "",
    family_friendly:
      overlay.familyFriendly === true ? "true" : overlay.familyFriendly === false ? "false" : "",
    pet_friendly: overlay.petFriendly === true ? "true" : overlay.petFriendly === false ? "false" : "",
    accessibility_notes: overlay.accessibilityNotes ?? "",
    latitude: String(place.latitude ?? ""),
    longitude: String(place.longitude ?? ""),
  };
}

function parseValue(field: string, value: string): unknown {
  if (field === "family_friendly" || field === "pet_friendly") {
    return value === "true";
  }
  if (field === "estimated_duration_minutes" || field === "latitude" || field === "longitude") {
    return Number(value);
  }
  return value;
}

export function PlaceEditDialog({
  place,
  overlay,
  open,
  field,
  onOpenChange,
}: {
  place: Place;
  overlay: PlaceFactsOverlay;
  open: boolean;
  field?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const next = currentValues(place, overlay);
    setValues(next);
    setInitial(next);
    setNote("");
    setMessage(null);
  }, [open, place, overlay]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const fields = EDITABLE_PLACE_FIELDS
      .filter((item) => (values[item.id] ?? "") !== (initial[item.id] ?? ""))
      .map((item) => ({
        fieldName: item.id,
        newValue: parseValue(item.id, values[item.id] ?? ""),
      }));
    if (fields.length === 0) {
      setMessage("Nisi izmenio nijedno polje.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/places/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeKey: place.id,
        sourceNote: note || undefined,
        fields,
      }),
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("Predlog nije poslat.");
      return;
    }
    setMessage("Predlog čeka odobrenje. Javni podaci se još ne menjaju.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Predloži izmenu</DialogTitle>
          <DialogDescription>
            Trenutni podaci su već uneti. Izmeni samo ono što treba da se ispravi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          {EDITABLE_PLACE_FIELDS.filter((item) => item.id !== "latitude" && item.id !== "longitude").map((item) => (
            <div key={item.id} className={`space-y-1.5 ${field === item.id ? "rounded-lg ring-2 ring-primary/40 p-2" : ""}`}>
              <Label htmlFor={`edit-${item.id}`}>{item.label}</Label>
              {item.id === "family_friendly" || item.id === "pet_friendly" ? (
                <select
                  id={`edit-${item.id}`}
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={values[item.id] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [item.id]: event.target.value }))}
                >
                  <option value="">Nije poznato</option>
                  <option value="true">Da</option>
                  <option value="false">Ne</option>
                </select>
              ) : item.id === "description" || item.id === "accessibility_notes" ? (
                <Textarea
                  id={`edit-${item.id}`}
                  value={values[item.id] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [item.id]: event.target.value }))}
                />
              ) : (
                <Input
                  id={`edit-${item.id}`}
                  value={values[item.id] ?? ""}
                  placeholder={
                    item.id === "estimated_duration_minutes" && place.estimatedDurationMinutes
                      ? formatDurationMinutes(place.estimatedDurationMinutes)
                      : undefined
                  }
                  onChange={(event) => setValues((current) => ({ ...current, [item.id]: event.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Izvor / napomena</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bio sam danas. / Podatak je sa zvaničnog sajta."
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={loading}>Pošalji predlog</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
