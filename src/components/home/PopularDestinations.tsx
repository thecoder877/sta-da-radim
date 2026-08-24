import Link from "next/link";
import { POPULAR_DESTINATIONS } from "@/lib/constants";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";

const TONES = ["bg-primary", "bg-[color-mix(in_oklch,var(--primary)_72%,var(--ochre))]", "bg-[color-mix(in_oklch,var(--primary)_55%,black)]", "bg-ochre"];

export function PopularDestinations() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          eyebrow="Popularna odredišta"
          title="Gde ljudi najčešće kreću"
          action={
            <Link href="/explore" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Vidi sva mesta
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_DESTINATIONS.map((destination, index) => (
            <Link
              key={destination.slug}
              href={`/explore?q=${encodeURIComponent(destination.name)}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className={`relative aspect-[4/3] ${TONES[index % TONES.length]}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-4 font-heading text-xl text-white">
                  {destination.name}
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">{destination.region}</p>
                <p className="mt-1 text-sm leading-6 text-foreground/80">
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
