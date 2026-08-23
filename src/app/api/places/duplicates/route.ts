import { NextResponse } from "next/server";
import { calculateDistanceKm } from "@/lib/geo/distance";
import { getPlaceRepository } from "@/lib/providers/places";
import { foldSerbian } from "@/lib/format";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ places: [] });
  }
  const catalog = await getPlaceRepository().listPlaces();
  const folded = foldSerbian(name);
  const nearby = catalog
    .map((place) => ({
      place,
      distance: calculateDistanceKm(
        { latitude: lat, longitude: lng },
        { latitude: place.latitude, longitude: place.longitude },
      ),
    }))
    .filter(({ place, distance }) => {
      const similar = folded && foldSerbian(place.name).includes(folded);
      return distance <= 0.5 || Boolean(similar && distance <= 3);
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(({ place, distance }) => ({
      id: place.id,
      slug: place.slug,
      name: place.name,
      city: place.city,
      distanceKm: Math.round(distance * 100) / 100,
    }));
  return NextResponse.json({ places: nearby });
}
