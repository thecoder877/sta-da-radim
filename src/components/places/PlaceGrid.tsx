import Link from "next/link";
import type { Place } from "@/types/place";
import { PlaceCard } from "@/components/places/PlaceCard";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";

export function PlaceGrid({
  places,
  emptyDescription,
}: {
  places: Place[];
  emptyDescription?: string;
}) {
  if (places.length === 0) {
    return (
      <EmptyState
        title="Nema mesta za ovu pretragu"
        description={
          emptyDescription ??
          "Promeni kategoriju, ukloni filtere ili potraži drugi deo Srbije."
        }
        action={
          <Button render={<Link href="/add-place" />}>
            + Dodaj mesto
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}
