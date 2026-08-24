"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Plus } from "lucide-react";
import { PlaceAddPhoto } from "@/components/community/PlaceAddPhoto";
import { PlaceFacts } from "@/components/community/PlaceFacts";
import { PlaceEditDialog } from "@/components/community/PlaceEditDialog";
import { PlaceReviews } from "@/components/community/PlaceReviews";
import { Button } from "@/components/ui/button";
import type { PlaceReview, ReviewSummary } from "@/types/community";
import type { Place } from "@/types/place";

export function PlaceCommunity({
  place,
  overlay,
  reviews,
  summary,
  photos = [],
}: {
  place: Place;
  overlay: Parameters<typeof PlaceFacts>[0]["overlay"];
  reviews: PlaceReview[];
  summary: ReviewSummary;
  photos?: { id: string; publicUrl: string; caption?: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState<string | undefined>();

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" render={<Link href="/plan" />}>
          <Plus data-icon="inline-start" />
          Dodaj u putovanje
        </Button>
        <Button variant="ghost" render={<Link href="/saved" />}>
          <Bookmark data-icon="inline-start" />
          Sačuvaj
        </Button>
      </div>
      <PlaceFacts
        place={place}
        overlay={overlay}
        onSuggest={(field) => {
          setEditField(field);
          setEditOpen(true);
        }}
      />
      <PlaceAddPhoto place={place} initialPhotos={photos} />
      <PlaceReviews place={place} initialReviews={reviews} initialSummary={summary} />
      <PlaceEditDialog
        place={place}
        overlay={overlay}
        open={editOpen}
        field={editField}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
