import { NextResponse } from "next/server";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { listOwnEdits } from "@/lib/community/edits";
import { listOwnReviews } from "@/lib/community/reviews";
import { listOwnSubmissions } from "@/lib/community/submissions";

export async function GET() {
  try {
    const { user, supabase } = await requireAuthed();
    const [submissions, edits, reviews] = await Promise.all([
      listOwnSubmissions(supabase, user.id),
      listOwnEdits(supabase, user.id),
      listOwnReviews(supabase, user.id),
    ]);
    return NextResponse.json({ submissions, edits, reviews });
  } catch (error) {
    return communityResponse(error);
  }
}
