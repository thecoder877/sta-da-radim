import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicTripByShareSlug } from "@/lib/trips/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nije podešen.", code: "SUPABASE_MISSING" }, { status: 503 });
  }

  try {
    const trip = await getPublicTripByShareSlug(supabase, slug);
    if (!trip) {
      return NextResponse.json({ error: "Putovanje nije javno ili ne postoji.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch {
    return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
  }
}
