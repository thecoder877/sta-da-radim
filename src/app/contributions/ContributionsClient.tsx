"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicLabel } from "@/lib/community/constants";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/states/LoadingState";
import type { PlaceEditRequest, PlaceReview, PlaceSubmissionRecord } from "@/types/community";

export function ContributionsClient() {
  const [submissions, setSubmissions] = useState<PlaceSubmissionRecord[]>([]);
  const [edits, setEdits] = useState<PlaceEditRequest[]>([]);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/contributions").then((response) => response.json()),
    ]).then(([data]) => {
      setSubmissions((data as { submissions?: PlaceSubmissionRecord[] }).submissions ?? []);
      setEdits((data as { edits?: PlaceEditRequest[] }).edits ?? []);
      setReviews((data as { reviews?: PlaceReview[] }).reviews ?? []);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <LoadingState message="Učitavamo doprinose..." />;
  }

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-heading text-4xl">Moji doprinosi</h1>
      <p className="mt-3 text-muted-foreground">Predlozi, izmene i status odobrenja.</p>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Moje lokacije</h2>
        {submissions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Još nema predloga. <Link href="/add-place" className="underline">Dodaj mesto</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {submissions.map((item) => (
              <li key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{publicLabel(item.status)}</p>
                {item.publicModeratorNote ? (
                  <p className="mt-1 text-sm">{item.publicModeratorNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Moje recenzije</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Još nema recenzija.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((item) => (
              <li key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
                <p className="font-medium">{item.rating}★ {item.title ?? ""}</p>
                <p className="text-sm text-muted-foreground">{item.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{publicLabel(item.status ?? "published")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Moje izmene</h2>
        {edits.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Još nema predloženih izmena.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {edits.map((item) => (
              <li key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
                <p className="font-medium">{publicLabel(item.status)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.fields.map((field) => field.fieldName).join(", ")}
                </p>
                {item.publicModeratorNote ? <p className="mt-1 text-sm">{item.publicModeratorNote}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
