import { Compass, Map, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";

const steps = [
  {
    icon: Compass,
    title: "Unesi šta želiš",
    text: "Polazak, datum, budžet, prevoz i ono što te stvarno zanima.",
  },
  {
    icon: Sparkles,
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
    <section className="bg-card py-16 sm:py-20">
      <Container>
        <p className="text-sm text-primary">Kako funkcioniše</p>
        <h2 className="mt-1 font-heading text-3xl sm:text-4xl">Tri koraka do izleta</h2>
        <div className="motion-stagger mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl bg-background p-6 ring-1 ring-foreground/8"
            >
              <div className="flex items-center justify-between">
                <step.icon className="size-5 text-primary" aria-hidden />
                <span className="text-sm text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-heading text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
