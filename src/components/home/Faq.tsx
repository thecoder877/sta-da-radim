import { ChevronDown } from "lucide-react";
import { Container } from "@/components/layout/Container";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Da li mi treba nalog da napravim plan?",
    answer:
      "Ne za prvi plan. Jedno putovanje možeš da napraviš bez naloga. Za čuvanje, izmene i deljenje planova napravi besplatan nalog.",
  },
  {
    question: "Odakle dolaze mesta u planu?",
    answer:
      "Iz naše baze i otvorene mape Srbije (OpenStreetMap). Ne izmišljamo lokacije — svako mesto u planu stварno postoji.",
  },
  {
    question: "Da li je aplikacija besplatna?",
    answer:
      "Da. Planiranje, pregled mesta i mape su besplatni. Procene cena u planu su orijentacione, ne tačan račun.",
  },
  {
    question: "Kako funkcioniše deljenje putovanja?",
    answer:
      "Kada sačuvaš plan, možeš da uključiš deljenje i dobiješ javni link. Taj link prikazuje itinerer i mapu, bez tvog imejla ili naloga.",
  },
  {
    question: "Da li mogu da menjam gotov plan?",
    answer:
      "Možeš da napraviš novi plan sa izmenjenim kriterijumima (polazak, dužina, budžet, interesovanja) u svakom trenutku.",
  },
];

export function Faq() {
  return (
    <section className="py-16" aria-labelledby="faq-heading">
      <Container>
        <h2 id="faq-heading" className="font-heading text-3xl">
          Česta pitanja
        </h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out-emph group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
