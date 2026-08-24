import { NextResponse } from "next/server";
import { generateTrip } from "@/lib/ai/generateTrip";
import {
  consumePlanEdit,
  consumePlanGeneration,
  isUnlimitedAccount,
  readPlanQuota,
} from "@/lib/access/planQuotaServer";
import { getProfileById } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIp, limitResponse, rateLimit } from "@/lib/security/rateLimit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tripRequestSchema } from "@/lib/validation/trip";

export async function POST(request: Request) {
  const limited = rateLimit(`generate:${clientIp(request)}`, 20, 60 * 1000);
  if (!limited.ok) {
    return limitResponse(limited.retryAfterSec);
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
    }

    const trip = await generateTrip(parsed.data);
    trip.generationId = quotaMeta.generationId ?? trip.generationId;
    trip.editCount = quotaMeta.editCount ?? trip.editCount;
    return NextResponse.json({
      trip,
      quota: user && supabase ? await readPlanQuota(supabase, user.id, unlimited) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_ENOUGH_PLACES" || message === "UNKNOWN_START") {
      return NextResponse.json(
        {
          error: "Nismo pronašli dovoljno mesta za ove kriterijume.",
          code: "NOT_ENOUGH_PLACES",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        error: "Trenutno nismo uspeli da napravimo plan. Pokušaj ponovo.",
        code: "GENERATE_FAILED",
      },
      { status: 500 },
    );
  }
}
