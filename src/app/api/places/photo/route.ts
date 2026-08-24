import { NextResponse } from "next/server";

function googleMapsKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref") ?? "";
  if (!/^[A-Za-z0-9_-]{8,400}$/.test(ref)) {
    return NextResponse.json({ error: "Neispravna fotografija." }, { status: 400 });
  }

  const key = googleMapsKey();
  if (!key) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  const params = new URLSearchParams({
    maxwidth: "1200",
    photo_reference: ref,
    key,
  });
  return NextResponse.redirect(
    `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`,
    302,
  );
}
