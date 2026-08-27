import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PlannerCta } from "@/components/home/PlannerCta";
import { PopularDestinations } from "@/components/home/PopularDestinations";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularDestinations />
      <HowItWorks />
      <CategoryGrid />
      <Faq />
      <PlannerCta />
    </>
  );
}
