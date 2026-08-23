export type PlaceSource = "internal" | "community" | "google" | "mapbox" | "osm";

export type PlaceEnvironment = "indoor" | "outdoor" | "mixed";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  category: string;
  tags: string[];
  estimatedDurationMinutes?: number;
  estimatedCostPerPerson?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  website?: string;
  openingHours?: string;
  source: PlaceSource;
  verified: boolean;
  createdAt?: string;
  environment?: PlaceEnvironment;
  suitableForChildren?: boolean;
  romantic?: boolean;
  hiddenGem?: boolean;
}

export interface PlaceFilters {
  query?: string;
  category?: string;
  region?: string;
  freeOnly?: boolean;
  paidOnly?: boolean;
  environment?: PlaceEnvironment;
  suitableForChildren?: boolean;
  romantic?: boolean;
  hiddenGem?: boolean;
  maxDistanceKm?: number;
  from?: Coordinates;
}
