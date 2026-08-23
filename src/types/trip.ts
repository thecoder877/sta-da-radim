import type { Coordinates, Place } from "@/types/place";

export type TransportType = "car" | "bus" | "train" | "walk" | "bike";

export type TravelStyle = "relaxed" | "balanced" | "packed";

export type DurationPreset = "hours" | "1" | "2" | "3" | "4plus";

export interface TripRequest {
  startLocation: {
    name: string;
    coordinates?: Coordinates;
  };
  startDate: string;
  days: number;
  durationPreset?: DurationPreset;
  numberOfPeople: number;
  budget?: number;
  transport: TransportType;
  maxDistanceKm?: number;
  interests: string[];
  travelStyle: TravelStyle;
  additionalPreferences?: string;
}

export type TripStopKind = "visit" | "lodging" | "start";

export interface TripStop {
  id: string;
  placeId: string;
  place: Place;
  arrivalTime: string;
  departureTime?: string;
  durationMinutes: number;
  reason?: string;
  estimatedCost?: number;
  kind?: TripStopKind;
}

export interface TripDay {
  dayNumber: number;
  date: string;
  stops: TripStop[];
}

export interface GeneratedTrip {
  id: string;
  title: string;
  description?: string;
  startLocation: string;
  startDate: string;
  days: number;
  transport: TransportType;
  totalDistanceKm?: number;
  totalTravelMinutes?: number;
  estimatedTotalCost?: number;
  stops: TripStop[];
  daysPlan: TripDay[];
  startCoordinates?: Coordinates;
  routeCoordinates?: Coordinates[];
  createdAt: string;
  shareSlug?: string;
  isPublic?: boolean;
}

export interface AiItineraryStop {
  placeId: string;
  arrivalTime: string;
  durationMinutes: number;
  reason?: string;
}

export interface AiItineraryDay {
  dayNumber: number;
  stops: AiItineraryStop[];
}

export interface AiItineraryResponse {
  title: string;
  summary: string;
  days: AiItineraryDay[];
}
