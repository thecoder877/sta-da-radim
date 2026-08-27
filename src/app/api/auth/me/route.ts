import { NextResponse } from "next/server";
import { isUnlimitedAccount, readPlanQuota } from "@/lib/access/planQuotaServer";
import { getUserFromClient } from "@/lib/auth/session";
import { getProfileById } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ user: null, profile: null, quota: null });
  }
  const user = await getUserFromClient(supabase);
  if (!user) {
    return NextResponse.json({ user: null, profile: null, quota: null });
  }
  const profile = await getProfileById(supabase, user.id);
  const unlimited = isUnlimitedAccount(profile);
  const quota = await readPlanQuota(supabase, user.id, unlimited);
  return NextResponse.json({
    user: { id: user.id },
    profile,
    quota,
  });
}
