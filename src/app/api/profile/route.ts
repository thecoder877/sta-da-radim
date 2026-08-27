import { NextResponse } from "next/server";
import { getProfileById, updateOwnProfile } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { profileUpdateSchema } from "@/lib/validation/community";

export async function GET() {
  try {
    const { user, supabase } = await requireAuthed();
    const profile = await getProfileById(supabase, user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireAuthed();
    const body: unknown = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neispravan profil.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const profile = await updateOwnProfile(supabase, user.id, parsed.data);
    return NextResponse.json({ profile });
  } catch (error) {
    return communityResponse(error);
  }
}
