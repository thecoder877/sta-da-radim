import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { createPlaceSubmission } from "@/lib/community/submissions";
import { placeSubmissionSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = placeSubmissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Neispravan predlog.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const id = await createPlaceSubmission(supabase, user.id, parsed.data);
    return NextResponse.json({ id });
  } catch (error) {
    return communityResponse(error);
  }
}
