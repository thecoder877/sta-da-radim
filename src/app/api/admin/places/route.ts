import { NextResponse } from "next/server";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";
import { approveSubmission, rejectSubmission } from "@/lib/community/submissions";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";
    const { data } = await supabase
      .from("place_submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ submissions: data ?? [] });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      id: string;
      action: "approve" | "reject" | "edit_approve";
      publicNote?: string;
      patch?: Record<string, unknown>;
    };
    if (body.action === "reject") {
      await rejectSubmission(supabase, user.id, body.id, body.publicNote);
      return NextResponse.json({ ok: true });
    }
    const slug = await approveSubmission(supabase, user.id, body.id, body.patch);
    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    return communityResponse(error);
  }
}
