import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PlaceFilters } from "@/components/places/PlaceFilters";
import { PlaceGrid } from "@/components/places/PlaceGrid";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import { searchCatalogExplore } from "@/lib/providers/places";
import type { PlaceEnvironment, PlaceFilters as Filters } from "@/types/place";

export const dynamic = "force-dynamic";

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
    page?: string;
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

  const { places, aroundLabel } = await searchCatalogExplore(filters);
  const pageSize = 24;
  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(places.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagePlaces = places.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") {
      query.set(key, value);
    }
  }

  function pageHref(nextPage: number) {
    const next = new URLSearchParams(query);
    if (nextPage > 1) {
      next.set("page", String(nextPage));
    }
    const suffix = next.toString();
    return suffix ? `/explore?${suffix}` : "/explore";
  }

  return (
    <Container className="py-10 sm:py-12">
      <p className="text-sm font-medium text-primary">Istraži Srbiju</p>
      <h1 className="mt-1 font-heading text-4xl tracking-tight">Mesta vredna puta</h1>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Ukucaj grad, vrstu mesta ili tačan naziv. Rezultati dolaze iz naše baze i otvorene mape Srbije.
        </p>
        <Button render={<Link href="/add-place" />} variant="outline">
          Dodaj mesto
        </Button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <Suspense fallback={<LoadingState message="Učitavamo filtere..." />}>
          <PlaceFilters />
        </Suspense>
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {places.length} {places.length === 1 ? "mesto" : "mesta"}
            {aroundLabel ? ` u okolini — ${aroundLabel}` : ""}
            {totalPages > 1 ? ` · strana ${currentPage} / ${totalPages}` : ""}
          </p>
          <PlaceGrid
            places={pagePlaces}
            emptyDescription="Probaj grad (Ruma, Beograd), vrstu mesta (bazen, manastir, jezero) ili tačan naziv."
          />
          {totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-between gap-3 text-sm" aria-label="Stranice">
              {currentPage > 1 ? (
                <Link href={pageHref(currentPage - 1)} className="hover:underline">
                  Prethodna
                </Link>
              ) : (
                <span />
              )}
              {currentPage < totalPages ? (
                <Link href={pageHref(currentPage + 1)} className="hover:underline">
                  Sledeća
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
