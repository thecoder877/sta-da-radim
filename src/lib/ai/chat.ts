import type { GeneratedTrip, TripRequest } from "@/types/trip";
import type { Place } from "@/types/place";

export interface TripChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Future trip-editing chat. The model may propose a new structured itinerary
 * from the existing trip + user message + available places. It must never
 * mutate database records directly.
 */
export async function proposeTripRevision(input: {
  trip: GeneratedTrip;
  request: TripRequest;
  message: string;
  availablePlaces: Place[];
}): Promise<GeneratedTrip> {
  void input;
  throw new Error("TRIP_CHAT_NOT_IMPLEMENTED");
}
