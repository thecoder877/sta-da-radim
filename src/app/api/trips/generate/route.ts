import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateTrip } from "@/lib/ai/generateTrip";
import {
  consumePlanEdit,
  consumePlanGeneration,
  isUnlimitedAccount,
  readPlanQuota,
} from "@/lib/access/planQuotaServer";
import {
  ANON_QUOTA_COOKIE,
  ANON_QUOTA_MAX_AGE_SECONDS,
  decodeQuota,
  encodeQuota,
  FREE_ANONYMOUS_GENERATIONS,
} from "@/lib/access/serverGenerationQuota";
import { getProfileById } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { errorMeta, logger } from "@/lib/logger";
import { rateLimitOrResponse } from "@/lib/security/apiGuards";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = tripRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neispravan zahtev.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const generationId =
      typeof body.generationId === "string" && body.generationId.length > 0
        ? body.generationId
        : undefined;

    const user = await getCurrentUser();
    const supabase = await createServerSupabaseClient();
    let quotaMeta: {
      generationId?: string;
      editCount?: number;
    } = {};
    let unlimited = false;
    let nextQuotaCount: number | null = null;

    if (user && supabase) {
      const profile = await getProfileById(supabase, user.id);
      unlimited = isUnlimitedAccount(profile);
      const decision = generationId
        ? await consumePlanEdit(supabase, user.id, generationId, unlimited)
        : await consumePlanGeneration(supabase, user.id, unlimited);

      if (!decision.ok) {
        const message =
          decision.reason === "QUOTA_EDITS"
            ? "Iskoristio si 3 izmene ovog plana. Sačekaj sledeći mesec ili nadogradi nalog."
            : "Iskoristio si 3 generisanja ovog meseca. Sačekaj reset ili nadogradi nalog.";
        return NextResponse.json(
          {
            error: message,
            code: decision.reason,
            resetsAt: decision.quota.resetsAt,
            quota: decision.quota,
          },
          { status: 429 },
        );
      }
      quotaMeta = {
        generationId: decision.generationId,
        editCount: decision.editCount,
      };
    } else if (!user && isSupabaseConfigured()) {
      // Server-side backstop for the anonymous free-generation limit.
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

    const trip = await generateTrip(parsed.data);
    trip.generationId = quotaMeta.generationId ?? trip.generationId;
    trip.editCount = quotaMeta.editCount ?? trip.editCount;
    const response = NextResponse.json({
      trip,
      quota:
        user && supabase ? await readPlanQuota(supabase, user.id, unlimited) : undefined,
    });
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
