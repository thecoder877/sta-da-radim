import { generateMockTrip } from "@/lib/ai/mockGenerateTrip";
import { getPlaceRepository } from "@/lib/providers/places";
import { tripRequestSchema } from "@/lib/validation/trip";
import type { GeneratedTrip, TripRequest } from "@/types/trip";

/**
 * Phase 1: deterministic mock itinerary.
 * Phase 3 will send ranked candidates to OpenAI and validate that every
 * returned placeId exists in the candidate set. The AI must never invent places.
 */
export async function generateTrip(
  input: TripRequest,
): Promise<GeneratedTrip> {
  const request = tripRequestSchema.parse(input);
  const places = await getPlaceRepository().listPlaces();
  return generateMockTrip(request, places);
}

export const AI_PLACE_CONSTRAINT =
  "You may only select places from the provided candidate list. Never invent locations.";
