"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlaceRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  source: string;
  is_published: boolean;
}

export default function AdminPlacesPage() {
  const [items, setItems] = useState<PlaceRow[]>([]);
  const [q, setQ] = useState("");
  const [published, setPublished] = useState("true");

  async function load(nextPublished = published, query = q) {
    const response = await fetch(
      `/api/admin/listings?published=${nextPublished}&q=${encodeURIComponent(query)}`,
    );
    const data = (await response.json()) as { places?: PlaceRow[] };
    setItems(data.places ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "unpublish" | "publish" | "delete") {
    if (action === "delete" && !window.confirm("Trajno obriši ovu odobrenu lokaciju?")) {
      return;
    }
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Lokacije</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Skini slučajno odobreno mesto sa sajta ili ga vrati. Trajno brisanje važi samo za community predloge.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Pretraga" className="max-w-xs" />
        <select
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          value={published}
          onChange={(event) => {
            setPublished(event.target.value);
            void load(event.target.value);
          }}
        >
          <option value="true">Na sajtu</option>
          <option value="false">Uklonjene</option>
          <option value="all">Sve</option>
        </select>
        <Button size="sm" onClick={() => void load()}>Traži</Button>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.city ?? "bez grada"} · {item.source} · {item.is_published ? "javno" : "uklonjeno"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" render={<Link href={`/place/${item.slug}`} />}>
                Otvori
              </Button>
              {item.is_published ? (
                <Button size="sm" variant="outline" onClick={() => void act(item.id, "unpublish")}>
                  Ukloni sa sajta
                </Button>
              ) : (
                <Button size="sm" onClick={() => void act(item.id, "publish")}>
                  Vrati na sajt
                </Button>
              )}
              {item.source === "community" ? (
                <Button size="sm" variant="destructive" onClick={() => void act(item.id, "delete")}>
                  Obriši
                </Button>
              ) : null}
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nema lokacija za ovaj filter.</p> : null}
      </div>
    </div>
  );
}
