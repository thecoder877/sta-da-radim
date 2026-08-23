"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface PhotoRow {
  id: string;
  storage_path: string;
  status: string;
  caption: string | null;
}

export default function AdminPhotosPage() {
  const [reviewPhotos, setReviewPhotos] = useState<PhotoRow[]>([]);
  const [placePhotos, setPlacePhotos] = useState<PhotoRow[]>([]);

  async function load() {
    const response = await fetch("/api/admin/photos");
    const data = (await response.json()) as { reviewPhotos?: PhotoRow[]; placePhotos?: PhotoRow[] };
    setReviewPhotos(data.reviewPhotos ?? []);
    setPlacePhotos(data.placePhotos ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, kind: "review" | "place", action: "remove" | "restore") {
    await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind, action }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Fotografije</h1>
      <section className="mt-6">
        <h2 className="font-heading text-xl">Recenzije</h2>
        <div className="mt-3 space-y-3">
          {reviewPhotos.map((photo) => (
            <article key={photo.id} className="rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/8">
              <p>{photo.storage_path}</p>
              <p className="text-muted-foreground">{photo.status}{photo.caption ? ` · ${photo.caption}` : ""}</p>
              <div className="mt-2 flex gap-2">
                {photo.status === "visible" ? (
                  <Button size="sm" variant="outline" onClick={() => void act(photo.id, "review", "remove")}>Ukloni</Button>
                ) : (
                  <Button size="sm" onClick={() => void act(photo.id, "review", "restore")}>Vrati</Button>
                )}
              </div>
            </article>
          ))}
          {reviewPhotos.length === 0 ? <p className="text-sm text-muted-foreground">Nema fotografija recenzija.</p> : null}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-heading text-xl">Mesta</h2>
        <div className="mt-3 space-y-3">
          {placePhotos.map((photo) => (
            <article key={photo.id} className="rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/8">
              <p>{photo.storage_path}</p>
              <p className="text-muted-foreground">{photo.status}</p>
              <div className="mt-2 flex gap-2">
                {photo.status === "visible" ? (
                  <Button size="sm" variant="outline" onClick={() => void act(photo.id, "place", "remove")}>Ukloni</Button>
                ) : (
                  <Button size="sm" onClick={() => void act(photo.id, "place", "restore")}>Vrati</Button>
                )}
              </div>
            </article>
          ))}
          {placePhotos.length === 0 ? <p className="text-sm text-muted-foreground">Nema fotografija mesta.</p> : null}
        </div>
      </section>
    </div>
  );
}
