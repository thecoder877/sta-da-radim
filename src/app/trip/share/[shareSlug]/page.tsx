import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedTripClient } from "@/app/trip/share/[shareSlug]/SharedTripClient";
import { APP_NAME } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicTripByShareSlug } from "@/lib/trips/repository";
import type { GeneratedTrip } from "@/types/trip";

async function loadSharedTrip(shareSlug: string): Promise<GeneratedTrip | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    return await getPublicTripByShareSlug(supabase, shareSlug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}): Promise<Metadata> {
  const { shareSlug } = await params;
  const trip = await loadSharedTrip(shareSlug);
  if (!trip) {
    return {
      title: "Deljeni plan nije dostupan",
      robots: { index: false, follow: false },
    };
  }

  const description =
    trip.description ??
    `Plan putovanja iz ${trip.startLocation} · ${trip.days} ${trip.days === 1 ? "dan" : "dana"}.`;

  return {
    title: trip.title,
    description,
    openGraph: {
      title: `${trip.title} · ${APP_NAME}`,
      description,
      locale: "sr_Latn_RS",
      type: "article",
    },
  };
}

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const trip = await loadSharedTrip(shareSlug);
  if (!trip && isSupabaseConfigured()) {
    notFound();
  }
  return <SharedTripClient slug={shareSlug} initialTrip={trip} />;
}
