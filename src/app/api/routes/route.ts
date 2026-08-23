import { NextResponse } from "next/server";
import { getTripRoute } from "@/lib/providers/routing";
import type { Coordinates } from "@/types/place";
import type { TransportType } from "@/types/trip";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      points?: Coordinates[];
      transport?: TransportType;
    };
    const points = body.points ?? [];
    if (points.length < 2) {
      return NextResponse.json({ route: null });
    }

    const route = await getTripRoute(points, body.transport ?? "car");
    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ route: null }, { status: 200 });
  }
}
