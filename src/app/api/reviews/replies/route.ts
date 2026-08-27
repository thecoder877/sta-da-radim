import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { addReply, softDeleteOwnReply } from "@/lib/community/reviews";
import { replyInputSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = replyInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Odgovor je prekratak.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    await addReply(supabase, user.id, parsed.data.reviewId, parsed.data.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await requireAuthed();
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json(
        { error: "Nedostaje odgovor.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    await softDeleteOwnReply(supabase, user.id, body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
