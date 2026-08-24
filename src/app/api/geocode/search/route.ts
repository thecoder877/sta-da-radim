import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/providers/geocoding/nominatim";
import { rateLimitOrResponse } from "@/lib/security/apiGuards";

const MAX_QUERY_LENGTH = 120;

export async function GET(request: Request) {
  const limited = rateLimitOrResponse(request, "geocode:search", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) {
    return limited;
  }

  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(
    0,
    MAX_QUERY_LENGTH,
  );

  try {
    const suggestions = await searchLocations(query);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { suggestions: [], error: "Pretraga lokacije trenutno nije dostupna." },
      { status: 200 },
    );
  }
}
