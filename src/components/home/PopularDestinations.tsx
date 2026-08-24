import Image from "next/image";
import Link from "next/link";
import { POPULAR_DESTINATIONS } from "@/lib/constants";
import { Container } from "@/components/layout/Container";

export function PopularDestinations() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-primary">Popularna odredišta</p>
            <h2 className="mt-1 font-heading text-3xl sm:text-4xl">
              Gde ljudi najčešće kreću
            </h2>
          </div>
          <Link href="/explore" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
            Vidi sva mesta
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_DESTINATIONS.map((destination) => (
            <Link
              key={destination.slug}
              href={`/explore?q=${encodeURIComponent(destination.name)}`}
              className="group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={destination.imageUrl}
                  alt={destination.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{destination.region}</p>
                <h3 className="mt-1 font-heading text-xl">{destination.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {destination.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
