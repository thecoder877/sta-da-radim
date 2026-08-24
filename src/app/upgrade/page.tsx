import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Nadogradi nalog",
};

export default function UpgradePage() {
  return (
    <Container className="max-w-4xl py-10 sm:py-16">
      <p className="text-sm text-muted-foreground">Nalog</p>
      <h1 className="mt-2 font-heading text-4xl">Više planova, bez čekanja</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Besplatan nalog ima 3 nova plana mesečno i 3 izmene po svakom planu. Kad potrošiš limit,
        tajmer pokazuje koliko je do sledećeg meseca. Plus skida to ograničenje.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Besplatno</p>
          <h2 className="mt-1 font-heading text-3xl">0 RSD</h2>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 text-primary" aria-hidden />
              3 generisanja mesečno
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 text-primary" aria-hidden />
              3 izmene po svakom planu
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 text-primary" aria-hidden />
              Čuvanje i deljenje planova
            </li>
          </ul>
          <Button variant="outline" className="mt-8 w-full" render={<Link href="/plan" />}>
            Ostani na besplatnom
          </Button>
        </article>

        <article className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm text-primary-foreground/80">Plus</p>
          <h2 className="mt-1 font-heading text-3xl">Uskoro</h2>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4" aria-hidden />
              Neograničena generisanja
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4" aria-hidden />
              Neograničene izmene planova
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4" aria-hidden />
              Bez mesečnog tajmera
            </li>
          </ul>
          <Button
            variant="secondary"
            className="mt-8 w-full"
            render={<a href="mailto:plus@stadaradim.rs?subject=Plus%20nalog" />}
          >
            Javi se za Plus
          </Button>
          <p className="mt-3 text-xs text-primary-foreground/75">
            Plaćanje još nije uključeno. Ostavi poruku pa te javimo kad Plus krene.
          </p>
        </article>
      </div>
    </Container>
  );
}
