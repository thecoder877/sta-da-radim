import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin } from "lucide-react";
import { PlaceCommunity } from "@/components/community/PlaceCommunity";
import { PlacePhoto } from "@/components/places/PlacePhoto";
import { Container } from "@/components/layout/Container";
import { TripMapLazy } from "@/components/map/TripMapLazy";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listReviewsForPlace } from "@/lib/community/reviews";
import { formatDurationMinutes } from "@/lib/format";
import {
  getPlaceRowByKey,
  listVisiblePlacePhotos,
  overlayFacts,
} from "@/lib/places/canonical";
import { authenticImageUrl, withPlaceImage } from "@/lib/places/placeImage";
import { resolvePlacePrice } from "@/lib/places/price";
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
      images: authenticImageUrl(place)
        ? [{ url: authenticImageUrl(place) as string }]
        : undefined,
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
    : {
        reviews: [],
        summary: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      };
  const photos = supabase ? await listVisiblePlacePhotos(supabase, place.id) : [];
  const overlay = row ? overlayFacts(row) : {};
  const catalogImage = authenticImageUrl({
    imageUrl: row?.image_url || place.imageUrl,
  });
  const displayPlace = withPlaceImage({
    ...place,
    imageUrl: catalogImage ?? photos[0]?.publicUrl,
  });
  const price = resolvePlacePrice(place, overlay);

  return (
    <article>
      <div className="relative h-[42vw] min-h-64 max-h-[420px] bg-[linear-gradient(160deg,#c45c26_0%,#8a5a32_45%,#3f4a38_100%)]">
        <PlacePhoto place={displayPlace} sizes="100vw" priority addHref="#fotografije" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <Container className="-mt-16 pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/8 sm:p-8">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {[place.city, place.region].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-2 font-heading text-4xl">{place.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{place.category}</Badge>
              {place.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag.replace("-", " ")}
                </Badge>
              ))}
            </div>
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              {place.description ?? place.shortDescription}
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/60 p-4">
                <dt className="text-xs text-muted-foreground">Trajanje posete</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  <Clock className="size-4 text-primary" aria-hidden />
                  {place.estimatedDurationMinutes
                    ? formatDurationMinutes(place.estimatedDurationMinutes)
                    : "Zavisi od ritma"}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <dt className="text-xs text-muted-foreground">Procena po osobi</dt>
                <dd className="mt-1 font-medium">{price ?? "Nije poznato"}</dd>
              </div>
            </dl>
            <PlaceCommunity
              place={place}
              overlay={overlay}
              reviews={community.reviews}
              summary={community.summary}
              photos={photos}
            />
          </div>

          <div className="h-[420px]">
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
              className="h-full overflow-hidden rounded-3xl"
            />
          </div>
        </div>
      </Container>
    </article>
  );
}
