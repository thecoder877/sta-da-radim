import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";

export function CategoryGrid() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader eyebrow="Kategorije" title="Šta te vuče ovog puta?" />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${encodeURIComponent(category.label)}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:border-primary/40 hover:bg-accent"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
