import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CommunityTeaser } from "@/components/home/CommunityTeaser";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PlannerCta } from "@/components/home/PlannerCta";
import { PopularDestinations } from "@/components/home/PopularDestinations";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularDestinations />
      <CategoryGrid />
      <HowItWorks />
      <CommunityTeaser />
      <PlannerCta />
    </>
  );
}
