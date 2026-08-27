import type { Metadata } from "next";
import { AddPlaceForm } from "@/app/add-place/AddPlaceForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Dodaj mesto",
  description: "Predloži novo mesto u Srbiji. Ide na proveru pre objave.",
};

export default function AddPlacePage() {
  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <p className="text-sm text-primary">Zajednica</p>
      <h1 className="mt-1 font-heading text-4xl">Dodaj mesto</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Predlog nije odmah javan. Moderator proverava podatke i može da ih ispravi pre
        odobrenja.
      </p>
      <div className="mt-8 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/8 sm:p-8">
        <AddPlaceForm />
      </div>
    </Container>
  );
}
