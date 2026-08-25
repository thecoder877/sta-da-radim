import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Clock, MapPin, Plus } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { TripMapLazy } from "@/components/map/TripMapLazy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDurationMinutes, formatRsd } from "@/lib/format";
import { getPlaceRepository } from "@/lib/providers/places";

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
      images: place.imageUrl ? [{ url: place.imageUrl }] : undefined,
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

  return (
    <article>
      <div className="relative h-[42vw] min-h-64 max-h-[420px] bg-[linear-gradient(160deg,#c45c26_0%,#8a5a32_45%,#3f4a38_100%)]">
        {place.imageUrl ? (
          <Image
            src={place.imageUrl}
            alt={place.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
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
                <dd className="mt-1 font-medium">
                  {place.estimatedCostPerPerson
                    ? formatRsd(place.estimatedCostPerPerson)
                    : "Obično bez ulaznice"}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button render={<Link href="/login" />}>
                <Bookmark data-icon="inline-start" />
                Sačuvaj
              </Button>
              <Button variant="outline" render={<Link href="/plan" />}>
                <Plus data-icon="inline-start" />
                Dodaj u putovanje
              </Button>
            </div>
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-heading text-2xl">Uskoro ovde</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Recenzije, fotografije posetilaca, obližnja mesta i saveti ljudi koji su
                već bili ovde.
              </p>
            </section>
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
