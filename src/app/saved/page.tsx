import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sačuvano",
  description: "Tvoja putovanja i sačuvana mesta.",
};

export default function SavedPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-heading text-4xl">Sačuvano</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Ovde će stajati tvoja putovanja i mesta koja želiš da posetiš. Za sada
        je potrebna prijava.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-2xl">Moja putovanja</h2>
          <EmptyState
            className="mt-4"
            title="Još nema sačuvanih putovanja"
            description="Napravi plan, pa ga sačuvaj kada budeš prijavljen."
            action={
              <Button render={<Link href="/plan" />}>Planiraj putovanje</Button>
            }
          />
        </section>
        <section>
          <h2 className="font-heading text-2xl">Sačuvana mesta</h2>
          <EmptyState
            className="mt-4"
            title="Lista je prazna"
            description="Istraži Srbiju i sačuvaj mesta koja ti se sviđaju."
            action={
              <Button variant="outline" render={<Link href="/explore" />}>
                Istraži mesta
              </Button>
            }
          />
        </section>
      </div>

      <div className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-foreground/8">
        <h2 className="font-heading text-2xl">Prijavi se da sačuvaš</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pregled i generisanje plana rade i bez naloga. Prijava je potrebna
          samo za čuvanje, recenzije i predlaganje novih mesta.
        </p>
        <div className="mt-4 flex gap-2">
          <Button render={<Link href="/login" />}>Prijavi se</Button>
          <Button variant="outline" render={<Link href="/register" />}>
            Napravi nalog
          </Button>
        </div>
      </div>
    </Container>
  );
}
