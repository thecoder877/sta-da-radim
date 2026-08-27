import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripRoute } from "@/lib/providers/routing";
import { rateLimitOrResponse } from "@/lib/security/apiGuards";

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const routesBodySchema = z.object({
  points: z.array(coordinateSchema).min(2).max(25),
  transport: z.enum(["car", "bus", "train", "walk", "bike"]).optional(),
});

export async function POST(request: Request) {
  const limited = rateLimitOrResponse(request, "routes", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) {
    return limited;
  }

  try {
    const parsed = routesBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { route: null, error: "Neispravne koordinate.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const route = await getTripRoute(parsed.data.points, parsed.data.transport ?? "car");
    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ route: null }, { status: 200 });
  }
}
