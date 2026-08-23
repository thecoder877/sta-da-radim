import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { softDeleteOwnReview, upsertReview } from "@/lib/community/reviews";
import { getPlaceRepository } from "@/lib/providers/places";
import { reviewInputSchema } from "@/lib/validation/community";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const { id } = await params;
    const parsed = reviewInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Neispravna recenzija.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const place = await getPlaceRepository().getPlaceById(parsed.data.placeKey);
    if (!place) {
      return NextResponse.json({ error: "Mesto nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
    }
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Recenzija nije pronađena.", code: "NOT_FOUND" }, { status: 404 });
    }
    await upsertReview(supabase, user.id, place, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireAuthed();
    const { id } = await params;
    await softDeleteOwnReview(supabase, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
