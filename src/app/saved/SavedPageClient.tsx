"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteTripFromAccount,
  fetchSavedTrips,
  updateTripSharing,
} from "@/lib/trips/clientApi";
import { formatDayLabel, formatDistance, formatRsd, formatTripDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SavedTripSummary } from "@/types/trip";

export function SavedPageClient() {
  const router = useRouter();
  const { user, ready, configured } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [trips, setTrips] = useState<SavedTripSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) {
      return;
    }

    let cancelled = false;
    void fetchSavedTrips()
      .then((items) => {
        if (!cancelled) {
          setTrips(items);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Lista putovanja trenutno nije dostupna.");
          setTrips([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const loading = Boolean(user && trips === null && !error);

  async function shareTrip(trip: SavedTripSummary) {
    setBusyId(trip.id);
    setMessage(null);
    try {
      const next = await updateTripSharing(trip.id, !trip.isPublic);
      setTrips((current) =>
        (current ?? []).map((item) =>
          item.id === trip.id
            ? {
                ...item,
                isPublic: Boolean(next.isPublic),
                shareSlug: next.shareSlug,
              }
            : item,
        ),
      );
      if (next.isPublic && next.shareSlug) {
        const url = `${window.location.origin}/trip/share/${next.shareSlug}`;
        await navigator.clipboard.writeText(url).catch(() => undefined);
        setMessage(`Link je kopiran: ${url}`);
      } else {
        setMessage("Deljenje je isključeno. Stari link više ne radi.");
      }
    } catch {
      setMessage("Deljenje nije ažurirano.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeTrip() {
    if (!deleteId) {
      return;
    }
    setBusyId(deleteId);
    try {
      await deleteTripFromAccount(deleteId);
      setTrips((current) => (current ?? []).filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch {
      setMessage("Putovanje nije obrisano.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return <LoadingState message="Proveravamo nalog..." />;
  }

  if (!configured || !isSupabaseConfigured()) {
    return (
      <Container className="py-12 sm:py-16">
        <ErrorState
          title="Supabase još nije podešen"
          description="Dodaj NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY da bi sačuvana putovanja radila."
        />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="max-w-2xl py-12 sm:py-16">
        <h1 className="font-heading text-4xl">Moja putovanja</h1>
        <p className="mt-3 text-muted-foreground">
          Prijavi se da vidiš sačuvane planove, deliš rute i nastaviš tamo gde si stao.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              openAuthModal({
                reason: "save_trip",
                initialMode: "login",
              })
            }
          >
            Prijavi se
          </Button>
          <Button variant="outline" render={<Link href="/register" />}>
            Napravi nalog
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Moja putovanja</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Sačuvani planovi ostaju na tvom nalogu i možeš ih otvoriti sa bilo kog uređaja.
          </p>
        </div>
        <Button render={<Link href="/plan" />}>Isplaniraj putovanje</Button>
      </div>

      {message ? <p className="mt-6 text-sm text-muted-foreground">{message}</p> : null}

      {loading ? <LoadingState message="Učitavamo putovanja..." /> : null}

      {error ? (
        <div className="mt-8">
          <ErrorState title="Putovanja nisu učitana" description={error} />
        </div>
      ) : null}

      {!loading && !error && trips && trips.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Još nemaš sačuvanih putovanja."
          description="Napravi plan, pa ga sačuvaj da ti ostane i posle zatvaranja pregledača."
          action={<Button render={<Link href="/plan" />}>Isplaniraj putovanje</Button>}
        />
      ) : null}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {(trips ?? []).map((trip) => (
          <Card key={trip.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xl">{trip.title}</CardTitle>
                <Badge variant={trip.isPublic ? "default" : "outline"}>
                  {trip.isPublic ? "Javno" : "Privatno"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatTripDate(trip.startDate)} · {formatDayLabel(trip.days)}
              </p>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Polazak: {trip.startLocation}</p>
              <p>
                {trip.totalDistanceKm
                  ? `~${formatDistance(trip.totalDistanceKm)}`
                  : "Udaljenost nije sačuvana"}
                {" · "}
                {trip.estimatedTotalCost
                  ? `~${formatRsd(trip.estimatedTotalCost)}`
                  : "Cena nije procenjena"}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => router.push(`/trip/${trip.id}`)}>
                Otvori
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === trip.id}
                onClick={() => void shareTrip(trip)}
              >
                {trip.isPublic ? "Isključi deljenje" : "Podeli"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === trip.id}
                onClick={() => setDeleteId(trip.id)}
              >
                Obriši
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši putovanje?</DialogTitle>
            <DialogDescription>Ovu radnju nije moguće poništiti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Odustani
            </Button>
            <Button variant="destructive" onClick={() => void removeTrip()} disabled={Boolean(busyId)}>
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
