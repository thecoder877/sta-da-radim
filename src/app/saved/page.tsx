import type { Metadata } from "next";
import { SavedPageClient } from "@/app/saved/SavedPageClient";

export const metadata: Metadata = {
  title: "Moja putovanja",
  description: "Sačuvani planovi putovanja po Srbiji.",
};

export default function SavedPage() {
  return <SavedPageClient />;
}
