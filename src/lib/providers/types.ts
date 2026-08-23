import type { Coordinates, Place, PlaceFilters } from "@/types/place";

export interface PlaceRepository {
  listPlaces(): Promise<Place[]>;
  getPlaceById(id: string): Promise<Place | null>;
  getPlaceBySlug(slug: string): Promise<Place | null>;
  searchPlaces(filters: PlaceFilters): Promise<Place[]>;
}

export interface GeocodingProvider {
  search(query: string): Promise<
    Array<{
      name: string;
      coordinates: Coordinates;
    }>
  >;
}

export interface RouteGeometry {
  distanceKm: number;
  durationMinutes: number;
  coordinates: Coordinates[];
}

export interface RoutingProvider {
  getRoute(
    points: Coordinates[],
    profile: "driving" | "walking" | "cycling",
  ): Promise<RouteGeometry | null>;
}

export interface WeatherSummary {
  date: string;
  temperatureC: number;
  condition: "clear" | "clouds" | "rain" | "snow" | "heat" | "unknown";
  precipitationMm?: number;
}

export interface WeatherProvider {
  getForecast(coordinates: Coordinates, date: string): Promise<WeatherSummary | null>;
}
