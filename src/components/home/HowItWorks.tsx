import { Compass, Map, Route } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";

const steps = [
  {
    icon: Compass,
    title: "Unesi šta želiš",
    text: "Polazak, datum, budžet, prevoz i ono što te stvarno zanima.",
  },
  {
    icon: Route,
    title: "Dobij personalizovan plan",
    text: "Biramo mesta iz naše baze i slažemo ih u logičan dan ili vikend.",
  },
  {
    icon: Map,
    title: "Kreni na put",
    text: "Vidi rutu na mapi, procenu troškova i vremena, pa kreni.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-card py-16 sm:py-20">
      <Container>
        <SectionHeader eyebrow="Kako funkcioniše" title="Tri koraka do izleta" />
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <div key={step.title}>
              <p className="text-sm font-medium text-primary">0{index + 1}</p>
              <step.icon className="mt-4 size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-heading text-2xl tracking-tight">{step.title}</h3>
              <p className="mt-2 text-base leading-7 text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
