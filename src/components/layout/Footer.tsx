import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-heading text-lg">{APP_NAME}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Planer izleta i putovanja po Srbiji. Biramo stvarna mesta, ne nasumične tačke na mapi.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-medium">Istraži</p>
            <Link href="/explore" className="text-muted-foreground hover:text-foreground">
              Mesta
            </Link>
            <Link href="/plan" className="text-muted-foreground hover:text-foreground">
              Planer
            </Link>
            <Link href="/trip/demo" className="text-muted-foreground hover:text-foreground">
              Primer putovanja
            </Link>
            <Link href="/add-place" className="text-muted-foreground hover:text-foreground">
              Dodaj mesto
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">Nalog</p>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Prijava
            </Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground">
              Registracija
            </Link>
            <Link href="/saved" className="text-muted-foreground hover:text-foreground">
              Sačuvano
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
