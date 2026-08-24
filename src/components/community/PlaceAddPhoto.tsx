"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PLACE_PHOTOS } from "@/lib/community/constants";
import type { Place } from "@/types/place";

export type PlacePhotoItem = { id: string; publicUrl: string; caption?: string };

export function PlaceAddPhoto({
  place,
  initialPhotos,
}: {
  place: Place;
  initialPhotos: PlacePhotoItem[];
}) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [photos, setPhotos] = useState(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function requireAuth(): boolean {
    if (user) {
      return true;
    }
    openAuthModal({
      reason: "community",
      pendingAction: { type: "community", href: `/place/${place.slug}#fotografije` },
    });
    return false;
  }

  async function onFiles(files: FileList | null) {
    if (!requireAuth()) {
      return;
    }
    const remaining = MAX_PLACE_PHOTOS - photos.length;
    const selected = Array.from(files ?? []).slice(0, remaining);
    if (selected.length === 0) {
      if (photos.length >= MAX_PLACE_PHOTOS) {
        setError(`Možeš dodati najviše ${MAX_PLACE_PHOTOS} fotografija.`);
      }
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    let failed: string | null = null;
    let added = 0;
    for (const file of selected) {
      const form = new FormData();
      form.set("placeKey", place.id);
      form.set("file", file);
      const response = await fetch("/api/places/photos", { method: "POST", body: form });
      const data = (await response.json()) as {
        error?: string;
        photo?: PlacePhotoItem;
      };
      if (!response.ok || !data.photo) {
        failed = data.error ?? "Otpremanje nije uspelo.";
        break;
      }
      const uploaded = data.photo;
      added += 1;
      setPhotos((current) =>
        current.some((item) => item.id === uploaded.id) ? current : [...current, uploaded],
      );
    }
    setBusy(false);
    if (failed) {
      setError(failed);
    } else if (added > 0) {
      setMessage(added === 1 ? "Fotografija je dodata i odmah je vidljiva." : "Fotografije su dodate i odmah su vidljive.");
    }
  }

  return (
    <section id="fotografije" className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">Fotografije</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Samo stvarne slike ovog mesta. Ako nema fotografije, ostaje prazno dok neko ne doda svoju.
          </p>
        </div>
        <div>
          <Label htmlFor="place-photo-upload" className="sr-only">
            Dodaj fotografiju
          </Label>
          <Input
            id="place-photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={busy || photos.length >= MAX_PLACE_PHOTOS}
            onChange={(event) => {
              void onFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || photos.length >= MAX_PLACE_PHOTOS}
            onClick={() => {
              if (!requireAuth()) {
                return;
              }
              document.getElementById("place-photo-upload")?.click();
            }}
          >
            <Camera data-icon="inline-start" />
            {busy ? "Otpremanje..." : "Dodaj fotografiju"}
          </Button>
        </div>
      </div>

      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.publicUrl}
              alt={photo.caption ?? place.name}
              className="h-32 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-muted/60 px-4 text-center">
          <Camera className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Još nema fotografije ovog mesta.</p>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
