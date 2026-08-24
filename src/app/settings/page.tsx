import type { Metadata } from "next";
import { SettingsForm } from "@/app/settings/SettingsForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Podešavanja",
};

export default function SettingsPage() {
  return (
    <Container className="max-w-xl py-10 sm:py-14">
      <h1 className="font-heading text-4xl">Podešavanja</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Email služi samo za prijavu i ne prikazuje se javno.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <SettingsForm />
      </div>
    </Container>
  );
}
