import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { HeroPlanner } from "@/components/home/HeroPlanner";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80"
          alt="Planinski vidikovac nad jezerom u Srbiji"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,20,12,0.72),rgba(28,20,12,0.28)_55%,rgba(28,20,12,0.18))]" />
      </div>

      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/75">
            Putovanja po Srbiji
          </p>
          <h1 className="mt-3 font-heading text-5xl leading-tight sm:text-6xl">
            Šta da radim?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">
            Otkrij Srbiju uz AI planer koji ti pravi putovanje prema vremenu,
            budžetu i interesovanjima.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-5" render={<Link href="/plan" />}>
              Planiraj putovanje
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 border-white/40 bg-white/10 px-5 text-white hover:bg-white/20"
              render={<Link href="/explore" />}
            >
              Istraži mesta
            </Button>
          </div>
          <HeroPlanner />
        </div>
      </Container>
    </section>
  );
}
