import { NextResponse } from "next/server";
import { isBotSubmission } from "@/lib/security/honeypot";
import { clientIp, limitResponse, rateLimit } from "@/lib/security/rateLimit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const limited = rateLimit(`register:${clientIp(request)}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return limitResponse(limited.retryAfterSec);
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Neispravan zahtev.",
        code: "INVALID_REQUEST",
      },
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

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName || undefined,
        username: parsed.data.username,
      },
    },
  });
  if (error) {
    const taken = error.message.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: taken
          ? "Ovaj email je već registrovan."
          : "Nalog nije napravljen. Pokušaj ponovo.",
        code: "AUTH_FAILED",
      },
      { status: taken ? 409 : 400 },
    );
  }
  return NextResponse.json({ ok: true, needsConfirm: !data.session });
}
