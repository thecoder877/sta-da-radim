import type { Coordinates, Place, PlaceFilters } from "@/types/place";

export interface PlaceRepository {
  listPlaces(): Promise<Place[]>;
  getPlaceById(id: string): Promise<Place | null>;
  getPlaceBySlug(slug: string): Promise<Place | null>;
  searchPlaces(filters: PlaceFilters): Promise<Place[]>;
}

export interface RouteGeometry {
  distanceKm: number;
  durationMinutes: number;
  coordinates: Coordinates[];
}
