import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { TripPlannerForm } from "@/components/trip/TripPlannerForm";
import { LoadingState } from "@/components/states/LoadingState";

export const metadata: Metadata = {
  title: "Planiraj putovanje",
  description:
    "Unesi polazak, budžet i interesovanja. Napravićemo ti plan izleta po Srbiji.",
};

export default function PlanPage() {
  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <p className="text-sm font-medium text-primary">Planer</p>
      <h1 className="mt-1 font-heading text-4xl tracking-tight">Planiraj putovanje</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
        Reci odakle krećeš i šta voliš. Plan slažemo od stvarnih mesta iz naše baze.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-8">
        <Suspense fallback={<LoadingState message="Pripremamo formular..." />}>
          <TripPlannerForm />
        </Suspense>
      </div>
    </Container>
  );
}
