import { tripSuccessfullyGenerated } from "@/lib/access/generationAccess";
import type { GeneratedTrip, TripRequest } from "@/types/trip";

export async function requestGeneratedTrip(request: TripRequest): Promise<GeneratedTrip> {
  const response = await fetch("/api/trips/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await response.json()) as {
    trip?: GeneratedTrip;
    error?: string;
    code?: string;
  };

  if (!response.ok || !tripSuccessfullyGenerated(data.trip)) {
    const error = new Error(data.error ?? "GENERATE_FAILED") as Error & { code?: string };
    error.code = data.code ?? "GENERATE_FAILED";
    throw error;
  }

  return data.trip as GeneratedTrip;
}
