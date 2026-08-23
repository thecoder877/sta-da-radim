import type { SupabaseClient } from "@supabase/supabase-js";
import { CommunityError } from "@/lib/community/errors";
import type { ReportInput } from "@/types/community";

export async function createReport(
  supabase: SupabaseClient,
  userId: string,
  input: ReportInput,
): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    reporter_user_id: userId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error?.code === "23505") {
    throw new CommunityError("Već si prijavio ovaj sadržaj.", "DUPLICATE_REPORT", 409);
  }
  if (error) {
    throw new CommunityError("Prijava nije poslata.", "INVALID_REQUEST");
  }
}
