import Link from "next/link";
import { Camera, MapPin, MessageSquare } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";

const items = [
  {
    icon: Camera,
    title: "Fotografije mesta",
    text: "Ako nema prave slike, ostaje prazno dok neko ne doda svoju.",
  },
  {
    icon: MessageSquare,
    title: "Recenzije",
    text: "Parking, gužva i da li vredi — od ljudi koji su stvarno bili tamo.",
  },
  {
    icon: MapPin,
    title: "Nova mesta",
    text: "Predloži lokaciju ili izmenu. Javno je tek kad prođe proveru.",
  },
];

export function CommunityTeaser() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          eyebrow="Lokalno znanje"
          title="Mapu dopunjuju ljudi koji putuju"
          description="Radno vreme, cene i fotografije nisu izmišljeni. Ako nešto fali, možeš da dodaš."
        />
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.title}>
              <item.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-heading text-xl">{item.title}</h3>
              <p className="mt-2 text-base leading-7 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button render={<Link href="/add-place" />}>Dodaj mesto</Button>
          <Button variant="outline" render={<Link href="/explore" />}>
            Istraži mesta
          </Button>
        </div>
      </Container>
    </section>
  );
}
