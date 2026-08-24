import { NextResponse } from "next/server";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";
import { sanitizeSearch } from "@/lib/security/search";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const q = sanitizeSearch(new URL(request.url).searchParams.get("q")).toLowerCase();
    let query = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, role, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (q) {
      query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    }
    const { data } = await query;
    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    return communityResponse(error);
  }
}
