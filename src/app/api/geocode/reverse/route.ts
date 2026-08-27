import { NextResponse } from "next/server";
import { SERBIA_BOUNDS } from "@/lib/constants";
import { reverseGeocode } from "@/lib/providers/geocoding/nominatim";
import { rateLimitOrResponse } from "@/lib/security/apiGuards";

function isWithinSerbia(latitude: number, longitude: number): boolean {
  return (
    latitude >= SERBIA_BOUNDS.south &&
    latitude <= SERBIA_BOUNDS.north &&
    longitude >= SERBIA_BOUNDS.west &&
    longitude <= SERBIA_BOUNDS.east
  );
}

export async function GET(request: Request) {
  const limited = rateLimitOrResponse(request, "geocode:reverse", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) {
    return limited;
  }

  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Neispravne koordinate." }, { status: 400 });
  }

  // The app only plans trips inside Serbia. Refuse to proxy global reverse
  // lookups so the endpoint cannot be used as an open Nominatim proxy.
  if (!isWithinSerbia(latitude, longitude)) {
    return NextResponse.json({ suggestion: null });
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
