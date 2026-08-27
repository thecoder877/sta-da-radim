import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Container } from "@/components/layout/Container";

export function CategoryGrid() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <p className="text-sm text-primary">Kategorije</p>
        <h2 className="mt-1 font-heading text-3xl sm:text-4xl">Šta te vuče ovog puta?</h2>
        <div className="motion-stagger mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${encodeURIComponent(category.label)}`}
              className="rounded-2xl bg-card px-4 py-5 text-center shadow-sm ring-1 ring-foreground/8 transition-[transform,box-shadow] duration-[160ms] ease-out-emph active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
            >
              <span className="font-medium">{category.label}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
