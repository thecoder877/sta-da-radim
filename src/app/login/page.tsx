import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Prijava",
};

export default function LoginPage() {
  return (
    <Container className="max-w-md py-16">
      <h1 className="font-heading text-4xl">Prijavi se</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Prijava preko emaila stiže u sledećoj fazi. Do tada možeš da istražuješ
        mesta i praviš privremene planove.
      </p>
      <form className="mt-8 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/8">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Lozinka</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11"
          />
        </div>
        <Button type="button" className="h-11 w-full" disabled>
          Prijava uskoro
        </Button>
        <Button type="button" variant="outline" className="h-11 w-full" disabled>
          Nastavi sa Google nalogom
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Nemaš nalog?{" "}
        <Link href="/register" className="text-foreground underline">
          Registruj se
        </Link>
      </p>
    </Container>
  );
}
