import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateTrip } from "@/lib/ai/generateTrip";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ANON_QUOTA_COOKIE,
  ANON_QUOTA_MAX_AGE_SECONDS,
  decodeQuota,
  encodeQuota,
  FREE_ANONYMOUS_GENERATIONS,
} from "@/lib/access/serverGenerationQuota";
import { errorMeta, logger } from "@/lib/logger";
import { rateLimitOrResponse } from "@/lib/security/apiGuards";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { tripRequestSchema } from "@/lib/validation/trip";

export async function POST(request: Request) {
  const limited = rateLimitOrResponse(request, "trips:generate", {
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) {
    return limited;
  }

  try {
    const body: unknown = await request.json();
    const parsed = tripRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neispravan zahtev.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Server-side backstop for the anonymous free-generation limit. Only
    // applies when accounts are available (Supabase configured); otherwise
    // there is no account to upgrade to, so we do not block.
    let nextQuotaCount: number | null = null;
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (!user) {
        const cookieStore = await cookies();
        const used = decodeQuota(cookieStore.get(ANON_QUOTA_COOKIE)?.value);
        if (used >= FREE_ANONYMOUS_GENERATIONS) {
          return NextResponse.json(
            {
              error: "Napravi nalog da napraviš još planova.",
              code: "AUTH_REQUIRED",
            },
            { status: 401 },
          );
        }
        nextQuotaCount = used + 1;
      }
    }

    const trip = await generateTrip(parsed.data);
    const response = NextResponse.json({ trip });
    if (nextQuotaCount !== null) {
      response.cookies.set(ANON_QUOTA_COOKIE, encodeQuota(nextQuotaCount), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ANON_QUOTA_MAX_AGE_SECONDS,
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_ENOUGH_PLACES") {
      return NextResponse.json(
        {
          error: "Nismo pronašli dovoljno mesta za ove kriterijume.",
          code: "NOT_ENOUGH_PLACES",
        },
        { status: 422 },
      );
    }

    logger.error("Trip generation failed", errorMeta(error));
    return NextResponse.json(
      {
        error: "Trenutno nismo uspeli da napravimo plan. Pokušaj ponovo.",
        code: "GENERATE_FAILED",
      },
      { status: 500 },
    );
  }
}
