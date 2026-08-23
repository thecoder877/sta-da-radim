"use client";

import { useState } from "react";
import { EDITABLE_PLACE_FIELDS } from "@/lib/community/constants";
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

export function PlaceEditDialog({
  place,
  open,
  field,
  onOpenChange,
}: {
  place: Place;
  open: boolean;
  field?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [fieldName, setFieldName] = useState(field ?? EDITABLE_PLACE_FIELDS[0].id);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selected = EDITABLE_PLACE_FIELDS.find((item) => item.id === (field ?? fieldName)) ?? EDITABLE_PLACE_FIELDS[0];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const parsedValue =
      selected.id === "family_friendly" || selected.id === "pet_friendly"
        ? value === "true"
        : selected.id === "estimated_duration_minutes"
          ? Number(value)
          : value;
    const response = await fetch("/api/places/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeKey: place.id,
        sourceNote: note || undefined,
        fields: [{ fieldName: selected.id, newValue: parsedValue }],
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Predloži izmenu</DialogTitle>
          <DialogDescription>Izmena ide na proveru pre nego što postane javna.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-field">Polje</Label>
            <select
              id="edit-field"
              className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={field ?? fieldName}
              onChange={(event) => setFieldName(event.target.value)}
            >
              {EDITABLE_PLACE_FIELDS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          {selected.id === "family_friendly" || selected.id === "pet_friendly" ? (
            <select className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm" value={value} onChange={(event) => setValue(event.target.value)}>
              <option value="true">Da</option>
              <option value="false">Ne</option>
            </select>
          ) : selected.id === "description" ? (
            <Textarea value={value} onChange={(event) => setValue(event.target.value)} required />
          ) : (
            <Input value={value} onChange={(event) => setValue(event.target.value)} required />
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Izvor / napomena</Label>
            <Textarea id="edit-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bio sam danas. / Podatak je sa zvaničnog sajta." />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={loading}>Pošalji predlog</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
