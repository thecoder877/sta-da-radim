import type { Place } from "@/types/place";
import { PlaceCard } from "@/components/places/PlaceCard";
import { EmptyState } from "@/components/states/EmptyState";

export function PlaceGrid({ places }: { places: Place[] }) {
  if (places.length === 0) {
    return (
      <EmptyState
        title="Nema mesta za ovu pretragu"
        description="Promeni kategoriju, ukloni filtere ili potraži drugi deo Srbije."
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
