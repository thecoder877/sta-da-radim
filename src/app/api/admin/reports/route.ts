import { NextResponse } from "next/server";
import { resolveReport } from "@/lib/admin/moderation";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as { id: string; action: "resolve" | "dismiss"; note?: string };
    await resolveReport(supabase, user.id, body.id, body.action === "dismiss" ? "dismissed" : "resolved", body.note);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
