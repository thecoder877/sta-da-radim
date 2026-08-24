import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function PlannerCta() {
  return (
    <section className="pb-20">
      <Container>
        <div className="rounded-2xl border border-border bg-primary px-6 py-14 text-primary-foreground sm:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">Nemaš ideju za vikend?</h2>
            <p className="mt-3 text-base leading-7 text-primary-foreground/80">
              Reci odakle krećeš i šta voliš. Složićemo plan od stvarnih mesta, ne od izmišljenih tačaka na mapi.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-7"
              render={<Link href="/plan" />}
            >
              Planiraj putovanje
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
