import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { createReport } from "@/lib/community/reports";
import { reportInputSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = reportInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Neispravna prijava.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    await createReport(supabase, user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
