import { NextResponse } from "next/server";
import { deleteCanonicalPlace, setPlacePublished } from "@/lib/admin/places";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";
import { sanitizeSearch } from "@/lib/security/search";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = sanitizeSearch(searchParams.get("q"));
    const published = searchParams.get("published") ?? "true";
    let query = supabase
      .from("places")
      .select("id, place_key, slug, name, city, source, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (published === "true") {
      query = query.eq("is_published", true);
    } else if (published === "false") {
      query = query.eq("is_published", false);
    }
    if (q) {
      query = query.ilike("name", `%${q}%`);
    }
    const { data } = await query;
    return NextResponse.json({ places: data ?? [] });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      id: string;
      action: "unpublish" | "publish" | "delete";
    };
    if (body.action === "delete") {
      await deleteCanonicalPlace(supabase, body.id);
    } else {
      await setPlacePublished(supabase, user.id, body.id, body.action === "publish");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
