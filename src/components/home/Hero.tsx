import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { HeroPlanner } from "@/components/home/HeroPlanner";

const SPOTS = [
  { name: "Fruška gora", hint: "Manastiri i vidikovci" },
  { name: "Tara", hint: "Kanjoni i jezero" },
  { name: "Đerdap", hint: "Dunavska klisura" },
  { name: "Zlatibor", hint: "Pašnjaci i pećine" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_10%,var(--background))_0%,var(--background)_72%)]">
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
        <div>
          <p className="text-sm font-medium text-primary">Putovanja po Srbiji</p>
          <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Otkrij Srbiju po svom ritmu.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Reci odakle krećeš, koliko imaš vremena i šta voliš. Slažemo izlet od stvarnih mesta — šetnje, vidikovci, manastiri, hrana — ne od izmišljenih tačaka.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/plan" />}>
              Planiraj putovanje
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/explore" />}>
              Istraži mesta
            </Button>
          </div>
          <HeroPlanner />
        </div>

        <div className="relative hidden min-h-[22rem] overflow-hidden rounded-2xl border border-border bg-card lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_100%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_55%),radial-gradient(90%_70%_at_90%_10%,color-mix(in_oklch,var(--ochre)_35%,transparent),transparent_50%)]" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[color-mix(in_oklch,var(--primary)_18%,var(--card))]" />
          <div className="absolute inset-x-[8%] bottom-[18%] h-1/3 rounded-t-[40%] bg-[color-mix(in_oklch,var(--primary)_32%,var(--card))]" />
          <div className="absolute right-[12%] bottom-[28%] h-1/4 w-1/3 rounded-t-[45%] bg-[color-mix(in_oklch,var(--primary)_22%,var(--ochre))]" />
          <ul className="relative z-10 grid h-full grid-cols-2 content-end gap-3 p-6">
            {SPOTS.map((spot) => (
              <li key={spot.name} className="rounded-xl border border-border/80 bg-card/90 p-3 backdrop-blur-sm">
                <p className="font-heading text-lg leading-tight">{spot.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{spot.hint}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
