import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { RegisterForm } from "@/app/register/RegisterForm";

export const metadata: Metadata = {
  title: "Registracija",
};

export default function RegisterPage() {
  return (
    <Container className="max-w-md py-16">
      <h1 className="font-heading text-4xl">Napravi nalog</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Nalog služi za čuvanje putovanja, deljenje ruta i nove planove posle prvog
        besplatnog izleta.
      </p>
      <div className="mt-8 rounded-2xl bg-card p-6 ring-1 ring-foreground/8">
        <RegisterForm />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Već imaš nalog?{" "}
        <Link href="/login" className="text-foreground underline">
          Prijavi se
        </Link>
      </p>
    </Container>
  );
}
