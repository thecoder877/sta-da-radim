import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { setReviewVote } from "@/lib/community/reviews";
import { voteInputSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = voteInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neispravan glas.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    await setReviewVote(supabase, user.id, parsed.data.reviewId, parsed.data.vote);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
