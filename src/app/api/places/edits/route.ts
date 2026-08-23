import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { createEditRequest } from "@/lib/community/edits";
import { getPlaceRepository } from "@/lib/providers/places";
import { placeEditSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = placeEditSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Neispravna izmena.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const place = await getPlaceRepository().getPlaceById(parsed.data.placeKey);
    if (!place) {
      return NextResponse.json({ error: "Mesto nije pronađeno.", code: "NOT_FOUND" }, { status: 404 });
    }
    const id = await createEditRequest(supabase, user.id, place, parsed.data.fields, parsed.data.sourceNote);
    return NextResponse.json({ id });
  } catch (error) {
    return communityResponse(error);
  }
}
