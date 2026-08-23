import { NextResponse } from "next/server";
import { getAdminCounts } from "@/lib/admin/moderation";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const counts = await getAdminCounts(supabase);
    return NextResponse.json(counts);
  } catch (error) {
    return communityResponse(error);
  }
}
