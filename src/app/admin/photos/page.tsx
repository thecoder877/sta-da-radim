"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface PhotoRow {
  id: string;
  storage_path: string;
  publicUrl?: string;
  status: string;
  caption: string | null;
}

function PhotoCard({
  photo,
  kind,
  onAct,
}: {
  photo: PhotoRow;
  kind: "review" | "place";
  onAct: (id: string, kind: "review" | "place", action: "remove" | "restore") => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      {photo.publicUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.publicUrl}
          alt={photo.caption ?? "Fotografija"}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
          Nema pregleda
        </div>
      )}
      <div className="p-4 text-sm">
        {photo.caption ? <p>{photo.caption}</p> : null}
        <p className="text-muted-foreground">{photo.status}</p>
        <div className="mt-2 flex gap-2">
          {photo.status === "visible" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAct(photo.id, kind, "remove")}
            >
              Ukloni
            </Button>
          ) : (
            <Button size="sm" onClick={() => onAct(photo.id, kind, "restore")}>
              Vrati
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminPhotosPage() {
  const [reviewPhotos, setReviewPhotos] = useState<PhotoRow[]>([]);
  const [placePhotos, setPlacePhotos] = useState<PhotoRow[]>([]);

  async function load() {
    const response = await fetch("/api/admin/photos");
    const data = (await response.json()) as {
      reviewPhotos?: PhotoRow[];
      placePhotos?: PhotoRow[];
    };
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviewPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              kind="review"
              onAct={(id, kind, action) => void act(id, kind, action)}
            />
          ))}
        </div>
        {reviewPhotos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nema fotografija recenzija.
          </p>
        ) : null}
      </section>
      <section className="mt-8">
        <h2 className="font-heading text-xl">Mesta</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {placePhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              kind="place"
              onAct={(id, kind, action) => void act(id, kind, action)}
            />
          ))}
        </div>
        {placePhotos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nema fotografija mesta.</p>
        ) : null}
      </section>
    </div>
  );
}
