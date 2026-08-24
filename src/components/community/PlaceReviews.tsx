"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ReportDialog } from "@/components/community/ReportDialog";
import { CROWD_OPTIONS, PARKING_OPTIONS, RECOMMENDED_FOR_OPTIONS } from "@/lib/community/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlaceReview, ReviewSummary } from "@/types/community";
import type { Place } from "@/types/place";

export function PlaceReviews({
  place,
  initialReviews,
  initialSummary,
}: {
  place: Place;
  initialReviews: PlaceReview[];
  initialSummary: ReviewSummary;
}) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [sort, setSort] = useState("helpful");
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("review") === "1") {
      setWriting(true);
    }
  }, []);

  async function reload(nextSort = sort) {
    const response = await fetch(`/api/reviews?placeKey=${encodeURIComponent(place.id)}&sort=${nextSort}`);
    const data = (await response.json()) as { reviews?: PlaceReview[]; summary?: ReviewSummary };
    setReviews(data.reviews ?? []);
    if (data.summary) {
      setSummary(data.summary);
    }
  }

  function requireAuth(href = `/place/${place.slug}`) {
    if (user) {
      return true;
    }
    openAuthModal({
      reason: "community",
      pendingAction: { type: "community", href },
    });
    return false;
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">Recenzije</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.count > 0 ? `${summary.average} · ${summary.count} recenzija` : "Još nema recenzija."}
          </p>
        </div>
        <Button
          onClick={() => {
            if (requireAuth(`${window.location.pathname}?review=1`)) {
              setWriting(true);
            }
          }}
        >
          Napiši recenziju
        </Button>
      </div>

      {summary.count >= 3 ? (
        <div className="mt-4 space-y-1 text-sm text-muted-foreground">
          {summary.worthVisitingPercent !== undefined ? (
            <p>{summary.worthVisitingPercent}% kaže da vredi posetiti</p>
          ) : null}
          {summary.parkingSummary ? <p>Parking: uglavnom {summary.parkingSummary.toLowerCase()}</p> : null}
          {summary.crowdSummary ? <p>Gužva: {summary.crowdSummary.toLowerCase()}</p> : null}
          {summary.recommendedFor?.length ? (
            <p>Najčešće preporučeno za: {summary.recommendedFor.map((item) => item.label).join(", ")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["helpful", "Najkorisnije"],
          ["newest", "Najnovije"],
          ["highest", "Najviše ocene"],
          ["lowest", "Najniže ocene"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full border px-3 py-1 text-sm ${sort === id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            onClick={() => {
              setSort(id);
              void reload(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {writing ? (
        <ReviewForm
          place={place}
          existing={reviews.find((review) => review.isOwner)}
          onDone={async () => {
            setWriting(false);
            await reload();
          }}
          onCancel={() => setWriting(false)}
        />
      ) : null}

      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}

      <div className="mt-6 space-y-5">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            place={place}
            review={review}
            editing={editingId === review.id}
            onNeedAuth={() => requireAuth()}
            onEdit={() => setEditingId(review.id)}
            onCancelEdit={() => setEditingId(null)}
            onChanged={async (note) => {
              setEditingId(null);
              setMessage(note ?? null);
              await reload();
            }}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewForm({
  place,
  existing,
  onDone,
  onCancel,
}: {
  place: Place;
  existing?: PlaceReview;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [visitDate, setVisitDate] = useState(existing?.visitDate ?? "");
  const [parking, setParking] = useState(existing?.parkingRating ?? "");
  const [crowd, setCrowd] = useState(existing?.crowdLevel ?? "");
  const [worth, setWorth] = useState<boolean | undefined>(existing?.worthVisiting);
  const [recommended, setRecommended] = useState<string[]>(existing?.recommendedFor ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeKey: place.id,
        rating,
        title: title || undefined,
        content,
        visitDate: visitDate || undefined,
        parkingRating: parking || undefined,
        crowdLevel: crowd || undefined,
        worthVisiting: worth,
        recommendedFor: recommended,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Recenzija nije sačuvana.");
      setLoading(false);
      return;
    }
    for (const file of files.slice(0, 5)) {
      const form = new FormData();
      form.set("placeKey", place.id);
      form.set("file", file);
      await fetch("/api/reviews/photos", { method: "POST", body: form });
    }
    setLoading(false);
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-muted/50 p-4">
      <div>
        <Label>Ocena *</Label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`size-9 rounded-full border text-sm ${rating >= value ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              onClick={() => setRating(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-title">Naslov</Label>
        <Input id="review-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-content">Recenzija *</Label>
        <Textarea id="review-content" rows={5} value={content} onChange={(event) => setContent(event.target.value)} required minLength={10} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="visit-date">Datum posete</Label>
          <Input id="visit-date" type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Parking</Label>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm" value={parking} onChange={(event) => setParking(event.target.value)}>
            <option value="">Nije bitno</option>
            {PARKING_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Gužva</Label>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm" value={crowd} onChange={(event) => setCrowd(event.target.value)}>
            <option value="">Nije bitno</option>
            {CROWD_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Da li vredi posetiti?</Label>
          <div className="flex gap-2">
            <Button type="button" variant={worth === true ? "default" : "outline"} onClick={() => setWorth(true)}>Da</Button>
            <Button type="button" variant={worth === false ? "default" : "outline"} onClick={() => setWorth(false)}>Ne</Button>
          </div>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Preporučeno za</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {RECOMMENDED_FOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-sm ${recommended.includes(option.id) ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() =>
                setRecommended((current) =>
                  current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id],
                )
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="review-photos">Fotografije</Label>
        <Input id="review-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Čuvam..." : existing ? "Sačuvaj izmene" : "Objavi"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Odustani</Button>
      </div>
    </form>
  );
}

function ReviewCard({
  place,
  review,
  editing,
  onNeedAuth,
  onEdit,
  onCancelEdit,
  onChanged,
}: {
  place: Place;
  review: PlaceReview;
  editing: boolean;
  onNeedAuth: () => boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChanged: (note?: string) => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "review" | "reply"; id: string }>({
    type: "review",
    id: review.id,
  });
  const name = review.author.displayName || review.author.username || "Korisnik";
  const tags = useMemo(() => {
    const items: string[] = [];
    if (review.parkingRating) {
      items.push(`Parking: ${PARKING_OPTIONS.find((item) => item.id === review.parkingRating)?.label ?? ""}`);
    }
    if (review.crowdLevel) {
      items.push(CROWD_OPTIONS.find((item) => item.id === review.crowdLevel)?.label ?? "");
    }
    if (review.worthVisiting === true) {
      items.push("Vredi posetiti");
    }
    if (review.worthVisiting === false) {
      items.push("Ne vredi");
    }
    for (const id of review.recommendedFor) {
      const label = RECOMMENDED_FOR_OPTIONS.find((item) => item.id === id)?.label;
      if (label) {
        items.push(label);
      }
    }
    return items.filter(Boolean);
  }, [review]);

  async function vote(next: 1 | -1) {
    if (!onNeedAuth()) {
      return;
    }
    const vote = review.viewerVote === next ? null : next;
    await fetch("/api/reviews/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id, vote }),
    });
    await onChanged();
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!onNeedAuth()) {
      return;
    }
    await fetch("/api/reviews/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id, content: reply }),
    });
    setReply("");
    setShowReply(false);
    await onChanged();
  }

  function report(type: "review" | "reply" = "review", id = review.id) {
    if (!onNeedAuth()) {
      return;
    }
    setReportTarget({ type, id });
    setReportOpen(true);
  }

  async function remove() {
    if (!window.confirm("Obriši recenziju?")) {
      return;
    }
    await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
    await onChanged();
  }

  return (
    <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          {review.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.author.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm">{name.slice(0, 1)}</span>
          )}
          <div>
          <p className="font-medium">{name}</p>
          {review.author.username ? <p className="text-xs text-muted-foreground">@{review.author.username}</p> : null}
          <p className="mt-1 text-sm">{Array.from({ length: review.rating }, () => "★").join("")}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("sr-Latn")}</p>
      </div>
      {editing ? (
        <ReviewForm place={place} existing={review} onDone={() => void onChanged()} onCancel={onCancelEdit} />
      ) : null}
      {!editing && review.title ? <h3 className="mt-3 font-medium">{review.title}</h3> : null}
      {!editing ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.content}</p> : null}
      {review.visitDate ? <p className="mt-2 text-xs text-muted-foreground">Poseta: {review.visitDate}</p> : null}
      {tags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>
          ))}
        </div>
      ) : null}
      {review.photos.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {review.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={photo.publicUrl} alt={photo.caption ?? "Fotografija recenzije"} className="h-28 w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Button size="sm" variant={review.viewerVote === 1 ? "default" : "outline"} onClick={() => void vote(1)}>
          👍 Korisno {review.helpfulCount}
        </Button>
        <Button size="sm" variant={review.viewerVote === -1 ? "default" : "outline"} onClick={() => void vote(-1)}>
          👎 Nije korisno {review.notHelpfulCount}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReply((value) => !value)}>Odgovori</Button>
        <Button size="sm" variant="ghost" onClick={() => report()}>Prijavi</Button>
        {review.isOwner ? (
          <>
            <Button size="sm" variant="ghost" onClick={onEdit}>Izmeni</Button>
            <Button size="sm" variant="ghost" onClick={() => void remove()}>Obriši</Button>
          </>
        ) : null}
      </div>
      {showReply ? (
        <form onSubmit={sendReply} className="mt-3 flex gap-2">
          <Input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Napiši odgovor" required />
          <Button type="submit" size="sm">Pošalji</Button>
        </form>
      ) : null}
      {review.replies.length ? (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {review.replies.map((item) => (
            <div key={item.id}>
              <p className="text-xs font-medium">{item.author.displayName || item.author.username || "Korisnik"}</p>
              <p className="text-sm text-muted-foreground">{item.content}</p>
              <div className="mt-1 flex gap-2">
                <button type="button" className="text-xs text-muted-foreground underline" onClick={() => report("reply", item.id)}>
                  Prijavi
                </button>
                {item.isOwner ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={async () => {
                      await fetch("/api/reviews/replies", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id }),
                      });
                      await onChanged();
                    }}
                  >
                    Obriši
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        onSubmitted={() => void onChanged("Prijava je poslata. Sadržaj ostaje vidljiv dok moderator ne odluči.")}
      />
    </article>
  );
}
