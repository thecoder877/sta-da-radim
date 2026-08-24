import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { PlaceCommunity } from "@/components/community/PlaceCommunity";
import { PlacePhoto } from "@/components/places/PlacePhoto";
import { Container } from "@/components/layout/Container";
import { TripMapLazy } from "@/components/map/TripMapLazy";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listReviewsForPlace } from "@/lib/community/reviews";
import { getPlaceRowByKey, listVisiblePlacePhotos, overlayFacts } from "@/lib/places/canonical";
import { authenticImageUrl, withPlaceImage } from "@/lib/places/placeImage";
import { getPlaceRepository } from "@/lib/providers/places";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceRepository().getPlaceBySlug(slug);
  if (!place) {
    return { title: "Mesto nije pronađeno" };
  }

  return {
    title: place.name,
    description: place.shortDescription,
    openGraph: {
      title: `${place.name} · Šta da radim?`,
      description: place.shortDescription,
      images: authenticImageUrl(place) ? [{ url: authenticImageUrl(place) as string }] : undefined,
    },
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceRepository().getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();
  const row = supabase ? await getPlaceRowByKey(supabase, place.id) : null;
  const community = supabase
    ? await listReviewsForPlace(supabase, place.id, user?.id)
    : { reviews: [], summary: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
  const photos = supabase ? await listVisiblePlacePhotos(supabase, place.id) : [];
  const overlay = row ? overlayFacts(row) : {};
  const catalogImage = authenticImageUrl({
    imageUrl: row?.image_url || place.imageUrl,
  });
  const displayPlace = withPlaceImage({
    ...place,
    imageUrl: catalogImage ?? photos[0]?.publicUrl,
  });
  const location = [place.city, place.region].filter(Boolean).join(" · ");

  return (
    <article>
      <div className="relative h-[38vw] min-h-56 max-h-[380px] bg-muted">
        <PlacePhoto
          place={displayPlace}
          sizes="100vw"
          priority
          addHref="#fotografije"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <Container className="pb-16 pt-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {location}
            </p>
            <h1 className="mt-2 font-heading text-4xl tracking-tight">{place.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{place.category}</Badge>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
              {place.description ?? place.shortDescription}
            </p>
            <PlaceCommunity
              place={place}
              overlay={overlay}
              reviews={community.reviews}
              summary={community.summary}
              photos={photos}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="h-56">
                <TripMapLazy
                  points={[
                    {
                      id: place.id,
                      name: place.name,
                      coordinates: {
                        latitude: place.latitude,
                        longitude: place.longitude,
                      },
                      description: place.shortDescription,
                    },
                  ]}
                  selectedId={place.id}
                  className="h-full"
                />
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </article>
  );
}
