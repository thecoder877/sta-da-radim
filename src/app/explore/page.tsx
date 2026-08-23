import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PlaceFilters } from "@/components/places/PlaceFilters";
import { PlaceGrid } from "@/components/places/PlaceGrid";
import { LoadingState } from "@/components/states/LoadingState";
import { getPlaceRepository } from "@/lib/providers/places";
import type { PlaceEnvironment, PlaceFilters as Filters } from "@/types/place";

export const metadata: Metadata = {
  title: "Istraži Srbiju",
  description:
    "Pregledaj jezera, tvrđave, manastire i skrivena mesta širom Srbije.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
    free?: string;
    paid?: string;
    outdoor?: string;
    indoor?: string;
    children?: string;
    romantic?: string;
    hidden?: string;
  }>;
}) {
  const params = await searchParams;
  const environment: PlaceEnvironment | undefined = params.outdoor
    ? "outdoor"
    : params.indoor
      ? "indoor"
      : undefined;

  const filters: Filters = {
    query: params.q,
    category: params.category,
    region: params.region,
    freeOnly: params.free === "1",
    paidOnly: params.paid === "1",
    environment,
    suitableForChildren: params.children === "1",
    romantic: params.romantic === "1",
    hiddenGem: params.hidden === "1",
  };

  const places = await getPlaceRepository().searchPlaces(filters);

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-sm text-primary">Istraži Srbiju</p>
      <h1 className="mt-1 font-heading text-4xl">Mesta vredna puta</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ovo nije nasumična mapa. Svako mesto ima svoju priču, okvirno vreme
        posete i procenu troška.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<LoadingState message="Učitavamo filtere..." />}>
          <PlaceFilters />
        </Suspense>
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {places.length} {places.length === 1 ? "mesto" : "mesta"}
          </p>
          <PlaceGrid places={places} />
        </div>
      </div>
    </Container>
  );
}
