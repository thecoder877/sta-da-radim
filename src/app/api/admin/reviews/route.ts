import { NextResponse } from "next/server";
import { setReplyStatus, setReviewStatus } from "@/lib/admin/moderation";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";
import { sanitizeSearch } from "@/lib/security/search";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "published";
    const q = sanitizeSearch(searchParams.get("q"));
    let query = supabase
      .from("reviews")
      .select("id, content, rating, status, place_key, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);
    if (q) {
      query = query.ilike("content", `%${q}%`);
    }
    const { data } = await query;
    return NextResponse.json({ reviews: data ?? [] });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      id: string;
      type?: "review" | "reply";
      action: "remove" | "restore" | "hide";
      note?: string;
    };
    const status = body.action === "restore" ? "published" : body.action === "hide" ? "hidden" : "removed";
    if (body.type === "reply") {
      await setReplyStatus(supabase, user.id, body.id, status, body.note);
    } else {
      await setReviewStatus(supabase, user.id, body.id, status, body.note);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
