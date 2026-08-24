import { NextResponse } from "next/server";
import { getProfileById } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, profile: null });
  }
  const supabase = await createServerSupabaseClient();
  const profile = supabase ? await getProfileById(supabase, user.id) : null;
  return NextResponse.json({
    user: { id: user.id },
    profile,
  });
}
