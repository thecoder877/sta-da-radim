import { NextResponse } from "next/server";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";
import { approveEditRequest, rejectEditRequest } from "@/lib/community/edits";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";
    const { data: requests } = await supabase
      .from("place_edit_requests")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);
    const ids = (requests ?? []).map((row) => row.id as string);
    const { data: fields } = ids.length
      ? await supabase.from("place_edit_suggestions").select("*").in("request_id", ids)
      : { data: [] };
    return NextResponse.json({ requests: requests ?? [], fields: fields ?? [] });
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
      await rejectEditRequest(supabase, user.id, body.id, body.publicNote);
    } else {
      await approveEditRequest(supabase, user.id, body.id, body.patch);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
