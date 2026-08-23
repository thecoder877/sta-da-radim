"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Submission {
  id: string;
  name: string;
  short_description: string;
  description: string | null;
  category: string;
  city: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  opening_hours: string | null;
  phone: string | null;
  website: string | null;
  source_note: string | null;
  status: string;
}

export default function AdminPlaceSubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<Record<string, Partial<Submission>>>({});

  async function load() {
    const response = await fetch("/api/admin/places?status=pending");
    const data = (await response.json()) as { submissions?: Submission[] };
    setItems(data.submissions ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "approve" | "reject" | "edit_approve") {
    const patch = editing[id];
    await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: action === "edit_approve" ? "approve" : action,
        publicNote: note || undefined,
        patch: patch
          ? {
              name: patch.name,
              shortDescription: patch.short_description,
              description: patch.description,
              category: patch.category,
              city: patch.city,
              address: patch.address,
              latitude: patch.latitude,
              longitude: patch.longitude,
              openingHours: patch.opening_hours,
              phone: patch.phone,
              website: patch.website,
            }
          : undefined,
      }),
    });
    await load();
  }

  function update(id: string, key: keyof Submission, value: string) {
    setEditing((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: key === "latitude" || key === "longitude" ? Number(value) : value,
      },
    }));
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Nove lokacije</h1>
      <input
        className="mt-4 h-10 w-full max-w-md rounded-lg border border-input bg-background px-3 text-sm"
        placeholder="Javna napomena uz odbijanje"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const draft = { ...item, ...editing[item.id] };
          return (
            <article key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Naziv</Label>
                  <Input value={draft.name} onChange={(event) => update(item.id, "name", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategorija</Label>
                  <Input value={draft.category} onChange={(event) => update(item.id, "category", event.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Kratak opis</Label>
                  <Textarea value={draft.short_description} onChange={(event) => update(item.id, "short_description", event.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Opis</Label>
                  <Textarea value={draft.description ?? ""} onChange={(event) => update(item.id, "description", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Grad</Label>
                  <Input value={draft.city ?? ""} onChange={(event) => update(item.id, "city", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Adresa</Label>
                  <Input value={draft.address ?? ""} onChange={(event) => update(item.id, "address", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Širina</Label>
                  <Input value={String(draft.latitude)} onChange={(event) => update(item.id, "latitude", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dužina</Label>
                  <Input value={String(draft.longitude)} onChange={(event) => update(item.id, "longitude", event.target.value)} />
                </div>
              </div>
              {item.source_note ? <p className="mt-3 text-sm">Napomena: {item.source_note}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void act(item.id, "approve")}>Odobri</Button>
                <Button size="sm" variant="outline" onClick={() => void act(item.id, "edit_approve")}>
                  Izmeni i odobri
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void act(item.id, "reject")}>Odbij</Button>
              </div>
            </article>
          );
        })}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nema predloga na čekanju.</p> : null}
      </div>
    </div>
  );
}
