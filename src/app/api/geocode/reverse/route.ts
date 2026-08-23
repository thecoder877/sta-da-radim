import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/providers/geocoding/nominatim";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Neispravne koordinate." }, { status: 400 });
  }

  try {
    const suggestion = await reverseGeocode({ latitude, longitude });
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json(
      { suggestion: null, error: "Lokacija nije prepoznata." },
      { status: 200 },
    );
  }
}
