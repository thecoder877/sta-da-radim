import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/trips/ids";
import { deleteSavedTrip, getSavedTripById, setTripSharing } from "@/lib/trips/repository";

const sharingUpdateSchema = z.object({ isPublic: z.boolean() });

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
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
  }

  const parsed = sharingUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Neispravan zahtev.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const trip = await setTripSharing(supabase, user.id, id, parsed.data.isPublic);
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
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Putovanje nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
  }

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
