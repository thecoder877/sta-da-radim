import Link from "next/link";
import { POPULAR_DESTINATIONS } from "@/lib/constants";
import { Container } from "@/components/layout/Container";

const TONES = [
  "bg-[linear-gradient(160deg,#c45c26_0%,#8a5a32_55%,#3f4a38_100%)]",
  "bg-[linear-gradient(160deg,#3f4a38_0%,#6b7c59_55%,#c4b48a_100%)]",
  "bg-[linear-gradient(160deg,#2c4a5c_0%,#5a7a6a_55%,#c45c26_100%)]",
  "bg-[linear-gradient(160deg,#5b4b8a_0%,#8a5a32_55%,#c4b48a_100%)]",
];

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
          {POPULAR_DESTINATIONS.map((destination, index) => (
            <Link
              key={destination.slug}
              href={`/explore?q=${encodeURIComponent(destination.name)}`}
              className="group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8"
            >
              <div className={`relative aspect-[4/3] ${TONES[index % TONES.length]}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <p className="absolute bottom-3 left-4 font-heading text-xl text-white">
                  {destination.name}
                </p>
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
