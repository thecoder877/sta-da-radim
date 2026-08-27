import { NextResponse } from "next/server";
import { isBotSubmission } from "@/lib/security/honeypot";
import { clientIp, limitResponse, rateLimit } from "@/lib/security/rateLimit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const limited = rateLimit(`login:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return limitResponse(limited.retryAfterSec);
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neispravan zahtev.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
  if (isBotSubmission(parsed.data)) {
    return NextResponse.json(
      { error: "Prijava trenutno nije dostupna.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nije podešen.", code: "SUPABASE_MISSING" },
      { status: 503 },
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return NextResponse.json(
      { error: "Pogrešan email ili lozinka.", code: "AUTH_FAILED" },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
