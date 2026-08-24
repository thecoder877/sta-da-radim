import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EDITS_PER_GENERATION,
  canEditGeneration,
  canStartGeneration,
  emptyQuota,
  monthStartUtc,
  quotaFromUsage,
  type PlanQuota,
  type QuotaDecision,
} from "@/lib/access/planQuota";

interface GenerationRow {
  id: string;
  user_id: string;
  edit_count: number;
  created_at: string;
}

export function isUnlimitedAccount(profile: { role?: string | null; plan?: string | null } | null): boolean {
  return profile?.role === "admin" || profile?.plan === "plus";
}

export async function readPlanQuota(
  supabase: SupabaseClient,
  userId: string,
  unlimited: boolean,
): Promise<PlanQuota> {
  const used = await countGenerationsThisMonth(supabase, userId);
  if (used == null) {
    return emptyQuota(unlimited);
  }
  return quotaFromUsage(used, unlimited);
}

async function countGenerationsThisMonth(
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const start = monthStartUtc().toISOString();
  const { count, error } = await supabase
    .from("plan_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start);

  if (!error) {
    return count ?? 0;
  }

  const fallback = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start);
  if (fallback.error) {
    return null;
  }
  return fallback.count ?? 0;
}

export async function consumePlanGeneration(
  supabase: SupabaseClient,
  userId: string,
  unlimited: boolean,
): Promise<QuotaDecision> {
  const quota = await readPlanQuota(supabase, userId, unlimited);
  if (!canStartGeneration(quota)) {
    return { ok: false, reason: "QUOTA_MONTH", quota };
  }

  const { data, error } = await supabase
    .from("plan_generations")
    .insert({ user_id: userId, edit_count: 0 })
    .select("id, edit_count")
    .single();

  if (error || !data) {
    return {
      ok: true,
      generationId: crypto.randomUUID(),
      editCount: 0,
      editsRemaining: EDITS_PER_GENERATION,
      quota: quotaFromUsage(quota.generationsUsed + 1, unlimited),
    };
  }

  return {
    ok: true,
    generationId: data.id as string,
    editCount: 0,
    editsRemaining: EDITS_PER_GENERATION,
    quota: quotaFromUsage(quota.generationsUsed + 1, unlimited),
  };
}

export async function consumePlanEdit(
  supabase: SupabaseClient,
  userId: string,
  generationId: string,
  unlimited: boolean,
): Promise<QuotaDecision> {
  const quota = await readPlanQuota(supabase, userId, unlimited);
  const { data, error } = await supabase
    .from("plan_generations")
    .select("id, user_id, edit_count, created_at")
    .eq("id", generationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return consumePlanGeneration(supabase, userId, unlimited);
  }

  const row = data as GenerationRow;
  if (!canEditGeneration(row.edit_count, unlimited)) {
    return {
      ok: false,
      reason: "QUOTA_EDITS",
      generationId: row.id,
      editCount: row.edit_count,
      editsRemaining: 0,
      quota,
    };
  }

  const nextCount = row.edit_count + 1;
  await supabase
    .from("plan_generations")
    .update({ edit_count: nextCount })
    .eq("id", row.id)
    .eq("user_id", userId);

  return {
    ok: true,
    generationId: row.id,
    editCount: nextCount,
    editsRemaining: Math.max(0, EDITS_PER_GENERATION - nextCount),
    quota,
  };
}
