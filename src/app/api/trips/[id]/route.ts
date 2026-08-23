import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/trips/ids";
import { deleteSavedTrip, getSavedTripById, setTripSharing } from "@/lib/trips/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nije podešen.", code: "SUPABASE_MISSING" }, { status: 503 });
  }

  const user = await getCurrentUser();

  try {
    const trip = await getSavedTripById(supabase, id, user?.id);
    if (!trip) {
      return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch {
    return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Prijava je potrebna.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nije podešen.", code: "SUPABASE_MISSING" }, { status: 503 });
  }

  const { id } = await params;
  const body = (await request.json()) as { isPublic?: boolean };

  try {
    const trip = await setTripSharing(supabase, user.id, id, Boolean(body.isPublic));
    if (!trip) {
      return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch {
    return NextResponse.json({ error: "Deljenje nije ažurirano.", code: "TRIP_UPDATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Prijava je potrebna.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nije podešen.", code: "SUPABASE_MISSING" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const deleted = await deleteSavedTrip(supabase, user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Putovanje nije obrisano.", code: "TRIP_DELETE_FAILED" }, { status: 500 });
  }
}
