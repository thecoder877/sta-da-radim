import { NextResponse } from "next/server";
import { communityResponse, requireAdmin } from "@/lib/community/apiAuth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const [{ data: reviews }, { data: places }] = await Promise.all([
      supabase.from("review_photos").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("place_photos").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const withUrl = (
      rows: Record<string, unknown>[] | null,
      bucket: "review-photos" | "place-submission-photos",
    ) =>
      (rows ?? []).map((row) => ({
        ...row,
        publicUrl: supabase.storage.from(bucket).getPublicUrl(row.storage_path as string).data.publicUrl,
      }));
    return NextResponse.json({
      reviewPhotos: withUrl((reviews ?? []) as Record<string, unknown>[], "review-photos"),
      placePhotos: withUrl((places ?? []) as Record<string, unknown>[], "place-submission-photos"),
    });
  } catch (error) {
    return communityResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      id: string;
      kind: "review" | "place";
      action: "remove" | "restore";
    };
    const table = body.kind === "place" ? "place_photos" : "review_photos";
    const status = body.action === "restore" ? "visible" : "removed";
    await supabase
      .from(table)
      .update({
        status,
        removed_at: status === "visible" ? null : new Date().toISOString(),
        removed_by: status === "visible" ? null : user.id,
      })
      .eq("id", body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return communityResponse(error);
  }
}
