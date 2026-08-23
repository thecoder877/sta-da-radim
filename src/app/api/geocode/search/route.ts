import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/providers/geocoding/nominatim";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

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
