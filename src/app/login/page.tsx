import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = {
  title: "Prijava",
};

export default function LoginPage() {
  return (
    <Container className="max-w-md py-16">
      <h1 className="font-heading text-4xl">Prijavi se</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Prijavi se da sačuvaš planove, deliš rute i praviš nove itinerere.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Nemaš nalog?{" "}
        <Link href="/register" className="text-foreground underline">
          Registruj se
        </Link>
      </p>
    </Container>
  );
}
