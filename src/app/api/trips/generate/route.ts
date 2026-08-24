import { NextResponse } from "next/server";
import { generateTrip } from "@/lib/ai/generateTrip";
import { clientIp, limitResponse, rateLimit } from "@/lib/security/rateLimit";
import { tripRequestSchema } from "@/lib/validation/trip";

export async function POST(request: Request) {
  const limited = rateLimit(`generate:${clientIp(request)}`, 20, 60 * 1000);
  if (!limited.ok) {
    return limitResponse(limited.retryAfterSec);
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

    const trip = await generateTrip(parsed.data);
    return NextResponse.json({ trip });
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
