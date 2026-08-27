import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { errorMeta, logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSavedTrips, saveGeneratedTrip } from "@/lib/trips/repository";
import { generatedTripSaveSchema } from "@/lib/validation/savedTrip";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Prijava je potrebna.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nije podešen.", code: "SUPABASE_MISSING" },
      { status: 503 },
    );
  }

  try {
    const trips = await listSavedTrips(supabase, user.id);
    return NextResponse.json({ trips });
  } catch (error) {
    logger.error("Listing saved trips failed", errorMeta(error));
    return NextResponse.json(
      { error: "Lista putovanja trenutno nije dostupna.", code: "TRIP_LIST_FAILED" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Prijava je potrebna.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nije podešen.", code: "SUPABASE_MISSING" },
      { status: 503 },
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = generatedTripSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neispravan plan za čuvanje.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const trip = await saveGeneratedTrip(supabase, user.id, parsed.data);
    return NextResponse.json({ trip });
  } catch (error) {
    logger.error("Saving trip failed", errorMeta(error));
    return NextResponse.json(
      { error: "Putovanje nije sačuvano. Pokušaj ponovo.", code: "TRIP_SAVE_FAILED" },
      { status: 500 },
    );
  }
}
