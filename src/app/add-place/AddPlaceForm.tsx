"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { LocationPicker } from "@/components/community/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/constants";
import type { Coordinates } from "@/types/place";

interface Duplicate {
  id: string;
  slug: string;
  name: string;
  city?: string;
  distanceKm: number;
}

export function AddPlaceForm() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [parkingInfo, setParkingInfo] = useState("");
  const [duration, setDuration] = useState("");
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [sourceNote, setSourceNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkDuplicates(next = coordinates) {
    if (!next) {
      return;
    }
    const params = new URLSearchParams({
      name,
      lat: String(next.latitude),
      lng: String(next.longitude),
    });
    const response = await fetch(`/api/places/duplicates?${params}`);
    const data = (await response.json()) as { places?: Duplicate[] };
    setDuplicates(data.places ?? []);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      openAuthModal({
        reason: "community",
        pendingAction: { type: "community", href: "/add-place" },
      });
      return;
    }
    if (!coordinates) {
      setError("Označi mesto na mapi.");
      return;
    }
    setLoading(true);
    setError(null);
    const response = await fetch("/api/places/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        shortDescription,
        description: description || undefined,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: address || undefined,
        city: city || undefined,
        category,
        openingHours: openingHours || undefined,
        phone: phone || undefined,
        website: website || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        priceInfo: priceInfo || undefined,
        parkingInfo: parkingInfo || undefined,
        estimatedDurationMinutes: duration ? Number(duration) : undefined,
        familyFriendly,
        petFriendly,
        sourceNote: sourceNote || undefined,
      }),
    });
    const data = (await response.json()) as { error?: string; id?: string };
    if (!response.ok) {
      setError(data.error ?? "Predlog nije poslat.");
      setLoading(false);
      return;
    }
    if (data.id) {
      for (const file of files.slice(0, 6)) {
        const form = new FormData();
        form.set("submissionId", data.id);
        form.set("file", file);
        await fetch("/api/places/submit/photos", { method: "POST", body: form });
      }
    }
    setLoading(false);
    setMessage("Predlog je poslat i čeka odobrenje. Još nije javno vidljiv.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="place-name">Naziv *</Label>
        <Input id="place-name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="place-short">Kratak opis *</Label>
        <Textarea id="place-short" value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} required minLength={10} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="place-desc">Opis</Label>
        <Textarea id="place-desc" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Kategorija *</Label>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="place-city">Grad</Label>
          <Input id="place-city" value={city} onChange={(event) => setCity(event.target.value)} />
        </div>
      </div>
      <div>
        <Label>Lokacija na mapi *</Label>
        <p className="mb-2 text-xs text-muted-foreground">Klikni ili pomeri marker.</p>
        <LocationPicker
          onChange={(next) => {
            setCoordinates(next);
            void checkDuplicates(next);
          }}
        />
        {coordinates ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
          </p>
        ) : null}
      </div>
      {duplicates.length ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="font-medium">Možda ovo mesto već postoji</p>
          <ul className="mt-2 space-y-1 text-sm">
            {duplicates.map((item) => (
              <li key={item.id}>
                <Link href={`/place/${item.slug}`} className="underline">
                  {item.name}
                </Link>
                {item.city ? ` · ${item.city}` : ""} · {item.distanceKm} km
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <details className="rounded-2xl bg-muted/40 p-4">
        <summary className="cursor-pointer font-medium">Više detalja (opciono)</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="place-address">Adresa</Label>
            <Input id="place-address" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-hours">Radno vreme</Label>
            <Input id="place-hours" value={openingHours} onChange={(event) => setOpeningHours(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-phone">Telefon</Label>
            <Input id="place-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-web">Website</Label>
            <Input id="place-web" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-ig">Instagram</Label>
            <Input id="place-ig" value={instagram} onChange={(event) => setInstagram(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-fb">Facebook</Label>
            <Input id="place-fb" value={facebook} onChange={(event) => setFacebook(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-price">Cena</Label>
            <Input id="place-price" value={priceInfo} onChange={(event) => setPriceInfo(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-parking">Parking</Label>
            <Input id="place-parking" value={parkingInfo} onChange={(event) => setParkingInfo(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-duration">Trajanje posete (min)</Label>
            <Input id="place-duration" type="number" min={1} value={duration} onChange={(event) => setDuration(event.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={familyFriendly} onChange={(event) => setFamilyFriendly(event.target.checked)} />
            Porodično
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={petFriendly} onChange={(event) => setPetFriendly(event.target.checked)} />
            Pet friendly
          </label>
        </div>
      </details>
      <div className="space-y-1.5">
        <Label htmlFor="place-photos">Fotografije</Label>
        <Input id="place-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 6))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="place-note">Izvor / napomena</Label>
        <Textarea id="place-note" value={sourceNote} onChange={(event) => setSourceNote(event.target.value)} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {duplicates.length ? "Ipak pošalji" : "Pošalji predlog"}
      </Button>
    </form>
  );
}
