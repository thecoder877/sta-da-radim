import { generateMockTrip } from "@/lib/ai/mockGenerateTrip";
import { resolveStartCoordinates } from "@/lib/locations";
import { searchLocations } from "@/lib/providers/geocoding/nominatim";
import { getPlaceRepository } from "@/lib/providers/places";
import { attachTripRoute, insertLodgingStops } from "@/lib/tripPlanner/enrichTrip";
import { tripRequestSchema } from "@/lib/validation/trip";
import type { GeneratedTrip, TripRequest } from "@/types/trip";

/**
 * Phase 1: deterministic mock itinerary.
 * Phase 3 will send ranked candidates to OpenAI and validate that every
 * returned placeId exists in the candidate set. The AI must never invent places.
 */
export async function generateTrip(input: TripRequest): Promise<GeneratedTrip> {
  const request = tripRequestSchema.parse(input);

  if (!request.startLocation.coordinates) {
    request.startLocation.coordinates =
      resolveStartCoordinates(request.startLocation.name) ??
      (await searchLocations(request.startLocation.name, 1))[0]?.coordinates;
  }

  const places = await getPlaceRepository().listPlaces();
  const trip = generateMockTrip(request, places);
  const origin = request.startLocation.coordinates ??
    resolveStartCoordinates(request.startLocation.name) ?? {
      latitude: 44.2,
      longitude: 20.8,
    };

  await insertLodgingStops(trip, request);
  await attachTripRoute(trip, origin, request.transport);
  trip.request = request;
  return trip;
}

export const AI_PLACE_CONSTRAINT =
  "You may only select places from the provided candidate list. Never invent locations.";
