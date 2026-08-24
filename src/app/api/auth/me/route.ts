import { NextResponse } from "next/server";
import { isUnlimitedAccount, readPlanQuota } from "@/lib/access/planQuotaServer";
import { emptyQuota } from "@/lib/access/planQuota";
import { getProfileById } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, profile: null, quota: null });
  }
  const supabase = await createServerSupabaseClient();
  const profile = supabase ? await getProfileById(supabase, user.id) : null;
  const unlimited = isUnlimitedAccount(profile);
  const quota = supabase
    ? await readPlanQuota(supabase, user.id, unlimited)
    : emptyQuota(unlimited);
  return NextResponse.json({
    user: { id: user.id },
    profile,
    quota,
  });
}
