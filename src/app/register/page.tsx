import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Registracija",
};

export default function RegisterPage() {
  return (
    <Container className="max-w-md py-16">
      <h1 className="font-heading text-4xl">Napravi nalog</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Nalog će služiti za čuvanje putovanja, omiljenih mesta i predlaganje
        novih lokacija. Registracija se povezuje u narednoj fazi.
      </p>
      <form className="mt-8 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/8">
        <div className="space-y-1.5">
          <Label htmlFor="name">Ime</Label>
          <Input id="name" autoComplete="name" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Lozinka</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-11"
          />
        </div>
        <Button type="button" className="h-11 w-full" disabled>
          Registracija uskoro
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Već imaš nalog?{" "}
        <Link href="/login" className="text-foreground underline">
          Prijavi se
        </Link>
      </p>
    </Container>
  );
}
