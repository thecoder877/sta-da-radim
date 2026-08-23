import type { Metadata } from "next";
import { TripPageClient } from "@/app/trip/[id]/TripPageClient";

export const metadata: Metadata = {
  title: "Tvoj plan putovanja",
  description: "Pregled itinerera, mape i procene troškova za izlet po Srbiji.",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripPageClient id={id} />;
}
