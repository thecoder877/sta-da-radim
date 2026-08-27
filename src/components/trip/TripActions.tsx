"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, RefreshCw, Share2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { QuotaLockedDialog } from "@/components/access/QuotaLockedDialog";
import {
  getGenerationAccess,
  hasUsedAnonymousGeneration,
  markAnonymousGenerationUsed,
  tripSuccessfullyGenerated,
} from "@/lib/access/generationAccess";
import { EDITS_PER_GENERATION, type PlanQuotaReason } from "@/lib/access/planQuota";
import { isQuotaError, requestGeneratedTrip } from "@/lib/trips/generateClient";
import {
  deleteTripFromAccount,
  saveTripToAccount,
  updateTripSharing,
} from "@/lib/trips/clientApi";
import {
  persistGeneratedTrip,
  persistLastTripRequest,
  readLastTripRequest,
} from "@/lib/trips/storage";
import type { GeneratedTrip } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TripActions({
  trip,
  onTripChange,
}: {
  trip: GeneratedTrip;
  onTripChange?: (trip: GeneratedTrip) => void;
}) {
  const router = useRouter();
  const { user, quota, refresh } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [quotaReason, setQuotaReason] = useState<PlanQuotaReason | null>(null);
  const persisted = Boolean(trip.persisted);
  const owner = trip.isOwner === true;
  const shareUrl =
    typeof window !== "undefined" && trip.shareSlug
      ? `${window.location.origin}/trip/share/${trip.shareSlug}`
      : "";

  async function saveTrip() {
    if (!user) {
      openAuthModal({
        reason: "save_trip",
        pendingAction: { type: "save_trip", trip },
        initialMode: "register",
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveTripToAccount(trip);
      persistGeneratedTrip(saved);
      onTripChange?.(saved);
      router.replace(`/trip/${saved.id}`);
      setMessage("Plan je sačuvan na tvoj nalog.");
    } catch {
      setMessage("Čuvanje nije uspelo. Pokušaj ponovo.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleShare() {
    if (!persisted || !trip.id) {
      setMessage("Prvo sačuvaj plan, pa ga podeli.");
      return;
    }
    setBusy(true);
    try {
      const next = await updateTripSharing(trip.id, !trip.isPublic);
      persistGeneratedTrip(next);
      onTripChange?.(next);
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
      setBusy(false);
    }
  }

  async function regenerate() {
    const request = trip.request ?? readLastTripRequest();
    if (!request) {
      router.push("/plan");
      return;
    }

    persistLastTripRequest(request);
    const access = getGenerationAccess(Boolean(user));
    if (!access.allowed) {
      openAuthModal({
        reason: "generation_limit",
        pendingAction: { type: "generate", request },
      });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const next = await requestGeneratedTrip(request, {
        generationId: trip.generationId,
      });
      if (!tripSuccessfullyGenerated(next)) {
        setMessage("Novi plan nije spreman. Pokušaj ponovo.");
        return;
      }
      persistGeneratedTrip(next);
      if (access.mode === "anonymous_free") {
        markAnonymousGenerationUsed();
      }
      if (user) {
        await refresh();
      }
      onTripChange?.(next);
      router.push(`/trip/${next.id}`);
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaReason(error.code);
        await refresh();
        return;
      }
      setMessage("Novi plan nije spreman. Pokušaj ponovo.");
    } finally {
      setBusy(false);
    }
  }

  async function removeTrip() {
    setBusy(true);
    try {
      await deleteTripFromAccount(trip.id);
      router.push("/saved");
    } catch {
      setMessage("Putovanje nije obrisano.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 pb-8">
      {!user && hasUsedAnonymousGeneration() ? (
        <p className="text-sm text-muted-foreground">
          Napravi nalog da menjaš ovaj plan ili napraviš novi.
        </p>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {owner && persisted && trip.isPublic && shareUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">{shareUrl}</span>
          <CopyButton
            value={shareUrl}
            label="Kopiraj link"
            className="ml-auto shrink-0"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => void saveTrip()}
          disabled={busy || persisted}
        >
          <Bookmark data-icon="inline-start" />
          {persisted ? "Sačuvano" : "Sačuvaj"}
        </Button>
        {owner && persisted ? (
          <Button variant="outline" onClick={() => void toggleShare()} disabled={busy}>
            <Share2 data-icon="inline-start" />
            {trip.isPublic ? "Isključi deljenje" : "Podeli"}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void saveTrip()} disabled={busy}>
            <Share2 data-icon="inline-start" />
            Podeli
          </Button>
        )}
        {owner && persisted ? (
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            <Trash2 data-icon="inline-start" />
            Obriši
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void regenerate()} disabled={busy}>
          <RefreshCw data-icon="inline-start" />
          Napravi novi plan
        </Button>
        <Button variant="ghost" render={<Link href="/plan" />}>
          Izmeni plan
        </Button>
      </div>
      {user && trip.generationId && !quota?.unlimited ? (
        <p className="text-xs text-muted-foreground">
          Još {Math.max(0, EDITS_PER_GENERATION - (trip.editCount ?? 0))} izmena ovog
          plana
        </p>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši putovanje?</DialogTitle>
            <DialogDescription>Ovu radnju nije moguće poništiti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Odustani
            </Button>
            <Button
              variant="destructive"
              onClick={() => void removeTrip()}
              disabled={busy}
            >
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuotaLockedDialog
        open={quotaReason !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuotaReason(null);
          }
        }}
        reason={quotaReason ?? "QUOTA_EDITS"}
        quota={quota}
      />
    </div>
  );
}
