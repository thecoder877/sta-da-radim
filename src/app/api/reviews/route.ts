import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireUsername } from "@/lib/auth/profile";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { listReviewsForPlace, upsertReview } from "@/lib/community/reviews";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlaceRepository } from "@/lib/providers/places";
import { reviewInputSchema } from "@/lib/validation/community";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      reviews: [],
      summary: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    });
  }
  const { searchParams } = new URL(request.url);
  const placeKey = searchParams.get("placeKey");
  const sort =
    (searchParams.get("sort") as "helpful" | "newest" | "highest" | "lowest") ??
    "helpful";
  if (!placeKey) {
    return NextResponse.json(
      { error: "Nedostaje mesto.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
  const user = await getCurrentUser();
  const result = await listReviewsForPlace(supabase, placeKey, user?.id, sort);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const parsed = reviewInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Neispravna recenzija.",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }
    const place = await getPlaceRepository().getPlaceById(parsed.data.placeKey);
    if (!place) {
      return NextResponse.json(
        { error: "Mesto nije pronađeno.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    await upsertReview(supabase, user.id, place, parsed.data);
    const result = await listReviewsForPlace(supabase, place.id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return communityResponse(error);
  }
}
