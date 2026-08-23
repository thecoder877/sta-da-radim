import type { Metadata } from "next";
import { ContributionsClient } from "@/app/contributions/ContributionsClient";

export const metadata: Metadata = {
  title: "Moji doprinosi",
};

export default function ContributionsPage() {
  return <ContributionsClient />;
}
