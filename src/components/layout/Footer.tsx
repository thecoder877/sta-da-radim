import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL, SITE_LAST_UPDATED } from "@/lib/constants";
import { formatTripDate } from "@/lib/format";
import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card print:hidden">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-heading text-lg">{APP_NAME}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            AI planer izleta i putovanja po Srbiji. Biramo mesta iz sopstvene baze, ne iz
            nasumične mape.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Kontakt:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Poslednje ažurirano: {formatTripDate(SITE_LAST_UPDATED)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-medium">Istraži</p>
            <Link href="/explore" className="text-muted-foreground hover:text-foreground">
              Mesta
            </Link>
            <Link href="/plan" className="text-muted-foreground hover:text-foreground">
              Planer
            </Link>
            <Link
              href="/trip/demo"
              className="text-muted-foreground hover:text-foreground"
            >
              Primer putovanja
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">Nalog</p>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Prijava
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground"
            >
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
