import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminCounts } from "@/types/community";

export async function getAdminCounts(supabase: SupabaseClient): Promise<AdminCounts> {
  const [places, edits, reports, reviews, photos] = await Promise.all([
    supabase
      .from("place_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("place_edit_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("target_type", "photo"),
  ]);
  return {
    pendingPlaces: places.count ?? 0,
    pendingEdits: edits.count ?? 0,
    openReports: reports.count ?? 0,
    publishedReviews: reviews.count ?? 0,
    reportedPhotos: photos.count ?? 0,
  };
}

export async function setReviewStatus(
  supabase: SupabaseClient,
  adminId: string,
  reviewId: string,
  status: "published" | "removed" | "hidden",
  reason?: string,
): Promise<void> {
  await supabase
    .from("reviews")
    .update({
      status,
      removed_at: status === "published" ? null : new Date().toISOString(),
      removed_by: status === "published" ? null : adminId,
      removal_reason: status === "published" ? null : (reason ?? "admin"),
    })
    .eq("id", reviewId);
}

export async function setReplyStatus(
  supabase: SupabaseClient,
  adminId: string,
  replyId: string,
  status: "published" | "removed" | "hidden",
  reason?: string,
): Promise<void> {
  await supabase
    .from("review_replies")
    .update({
      status,
      removed_at: status === "published" ? null : new Date().toISOString(),
      removed_by: status === "published" ? null : adminId,
      removal_reason: status === "published" ? null : (reason ?? "admin"),
    })
    .eq("id", replyId);
}

export async function resolveReport(
  supabase: SupabaseClient,
  adminId: string,
  reportId: string,
  status: "resolved" | "dismissed",
  note?: string,
): Promise<void> {
  await supabase
    .from("reports")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_note: note ?? null,
    })
    .eq("id", reportId);
}
