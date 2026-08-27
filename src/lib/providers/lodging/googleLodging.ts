import { slugify } from "@/lib/format";
import { withPlaceImage } from "@/lib/places/placeImage";
import type { Place } from "@/types/place";

function googleMapsKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

interface GoogleNearbyResult {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat: number; lng: number } };
  types?: string[];
  photos?: Array<{ photo_reference?: string }>;
}

export async function searchGoogleLodging(
  latitude: number,
  longitude: number,
  radiusMeters = 12000,
): Promise<Place[]> {
  const key = googleMapsKey();
  if (!key) {
    return [];
  }

  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: String(radiusMeters),
    type: "lodging",
    key,
    language: "sr",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    status?: string;
    results?: GoogleNearbyResult[];
  };
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return [];
  }

  return (data.results ?? [])
    .map((item): Place | null => {
      const lat = item.geometry?.location?.lat;
      const lng = item.geometry?.location?.lng;
      if (!item.name || lat === undefined || lng === undefined) {
        return null;
      }
      const photoRef = item.photos?.[0]?.photo_reference;
      return withPlaceImage({
        id: `google-${item.place_id}`,
        name: item.name,
        slug: `${slugify(item.name)}-${item.place_id.slice(-6)}`,
        shortDescription: item.vicinity
          ? `${item.name} — ${item.vicinity}.`
          : `${item.name} — predlog za noćenje.`,
        latitude: lat,
        longitude: lng,
        city: item.vicinity?.split(",").at(-1)?.trim(),
        category: "Smeštaj",
        tags: ["hotel", "prenociste"],
        estimatedDurationMinutes: 720,
        estimatedCostPerPerson: 5500,
        rating: item.rating,
        reviewCount: item.user_ratings_total,
        imageUrl: photoRef
          ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}`
          : undefined,
        source: "google",
        verified: Boolean(item.rating && item.rating >= 4),
        environment: "mixed",
      });
    })
    .filter((place): place is Place => place !== null);
}
