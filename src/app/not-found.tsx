import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="text-sm text-primary">404</p>
      <h1 className="mt-2 font-heading text-4xl">Ova stranica ne postoji</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Možda je putovanje obrisano, ili je adresa pogrešna. Vrati se na početnu ili
        napravi novi plan.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button render={<Link href="/" />}>Početna</Button>
        <Button variant="outline" render={<Link href="/plan" />}>
          Planiraj putovanje
        </Button>
      </div>
    </Container>
  );
}
