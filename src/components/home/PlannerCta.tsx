import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function PlannerCta() {
  return (
    <section className="pb-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80"
            alt="Manastir Jazak na Fruškoj gori"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-foreground/55" />
          <div className="relative px-6 py-16 text-center text-white sm:px-12">
            <h2 className="font-heading text-3xl sm:text-4xl">Nemaš ideju za vikend?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Reci odakle krećeš i šta voliš. Mi ćemo složiti plan od stvarnih mesta,
              ne od izmišljenih tačaka na mapi.
            </p>
            <Button
              size="lg"
              className="mt-6 h-11 px-5"
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
