import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/format";
import { authenticImageUrl } from "@/lib/places/placeImage";
import type { Place, PlaceSource } from "@/types/place";

export interface PlaceRow {
  id: string;
  place_key: string;
  source: PlaceSource;
  external_id: string | null;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  region: string | null;
  category: string | null;
  opening_hours: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  price_info: string | null;
  parking_info: string | null;
  estimated_duration_minutes: number | null;
  estimated_cost_per_person: number | null;
  environment: string | null;
  family_friendly: boolean | null;
  pet_friendly: boolean | null;
  accessibility_notes: string | null;
  tags: string[] | null;
  image_url: string | null;
  last_verified_at: string | null;
  is_published: boolean;
}

export function placeFromRow(row: PlaceRow): Place {
  return {
    id: row.place_key,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? row.name,
    description: row.description ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city ?? undefined,
    region: row.region ?? undefined,
    category: row.category ?? "Srbija",
    tags: row.tags ?? [],
    estimatedDurationMinutes: row.estimated_duration_minutes ?? undefined,
    estimatedCostPerPerson: row.estimated_cost_per_person ?? undefined,
    imageUrl: authenticImageUrl({ imageUrl: row.image_url ?? undefined }),
    website: row.website ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    source: row.source,
    verified: Boolean(row.last_verified_at),
    environment: row.environment === "indoor" || row.environment === "outdoor" || row.environment === "mixed"
      ? row.environment
      : undefined,
    suitableForChildren: row.family_friendly ?? undefined,
  };
}

export function applyPlaceOverlay(place: Place, row: PlaceRow | null): Place {
  if (!row) {
    return place;
  }
  return {
    ...place,
    name: row.name || place.name,
    shortDescription: row.short_description || place.shortDescription,
    description: row.description || place.description,
    latitude: row.latitude || place.latitude,
    longitude: row.longitude || place.longitude,
    city: row.city || place.city,
    region: row.region || place.region,
    category: row.category || place.category,
    tags: row.tags?.length ? row.tags : place.tags,
    website: row.website || place.website,
    openingHours: row.opening_hours || place.openingHours,
    estimatedDurationMinutes: row.estimated_duration_minutes ?? place.estimatedDurationMinutes,
    estimatedCostPerPerson: row.estimated_cost_per_person ?? place.estimatedCostPerPerson,
    imageUrl: authenticImageUrl({ imageUrl: row.image_url ?? undefined }) ?? authenticImageUrl(place),
    suitableForChildren: row.family_friendly ?? place.suitableForChildren,
  };
}

export async function getPlaceRowByKey(
  supabase: SupabaseClient,
  placeKey: string,
): Promise<PlaceRow | null> {
  const { data } = await supabase.from("places").select("*").eq("place_key", placeKey).maybeSingle();
  return (data as PlaceRow | null) ?? null;
}

export async function getPlaceRowBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PlaceRow | null> {
  const { data } = await supabase
    .from("places")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as PlaceRow | null) ?? null;
}

export async function listPublishedCommunityPlaces(supabase: SupabaseClient): Promise<Place[]> {
  const { data } = await supabase
    .from("places")
    .select("*")
    .eq("source", "community")
    .eq("is_published", true);
  return ((data ?? []) as PlaceRow[]).map(placeFromRow);
}

export async function ensureCanonicalPlace(
  supabase: SupabaseClient,
  place: Place,
  userId?: string,
): Promise<PlaceRow> {
  const existing = await getPlaceRowByKey(supabase, place.id);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("places")
    .insert({
      place_key: place.id,
      source: place.source,
      external_id: place.id,
      slug: place.slug || slugify(place.name),
      name: place.name,
      short_description: place.shortDescription,
      description: place.description ?? null,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city ?? null,
      region: place.region ?? null,
      category: place.category,
      opening_hours: place.openingHours ?? null,
      website: place.website ?? null,
      estimated_duration_minutes: place.estimatedDurationMinutes ?? null,
      estimated_cost_per_person: place.estimatedCostPerPerson ?? null,
      environment: place.environment ?? null,
      family_friendly: place.suitableForChildren ?? null,
      tags: place.tags,
      image_url: authenticImageUrl(place) ?? null,
      is_published: true,
      created_by: userId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    const retry = await getPlaceRowByKey(supabase, place.id);
    if (retry) {
      return retry;
    }
    throw new Error("PLACE_UPSERT_FAILED");
  }
  return data as PlaceRow;
}

function photoPublicUrl(supabase: SupabaseClient, storagePath: string): string {
  return supabase.storage.from("place-submission-photos").getPublicUrl(storagePath).data.publicUrl;
}

export async function listVisiblePlacePhotos(
  supabase: SupabaseClient,
  placeKey: string,
): Promise<{ id: string; publicUrl: string; caption?: string }[]> {
  const { data } = await supabase
    .from("place_photos")
    .select("*")
    .eq("place_key", placeKey)
    .eq("status", "visible")
    .order("is_primary", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    publicUrl: photoPublicUrl(supabase, row.storage_path as string),
    caption: (row.caption as string | null) ?? undefined,
  }));
}

export async function listVisibleCoverUrls(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("place_photos")
    .select("place_key, storage_path, is_primary")
    .eq("status", "visible")
    .order("is_primary", { ascending: false })
    .limit(800);
  const covers = new Map<string, string>();
  for (const row of (data ?? []) as { place_key: string; storage_path: string }[]) {
    if (covers.has(row.place_key)) {
      continue;
    }
    covers.set(row.place_key, photoPublicUrl(supabase, row.storage_path));
  }
  return covers;
}

export function overlayFacts(row: PlaceRow) {
  return {
    address: row.address,
    openingHours: row.opening_hours,
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    facebook: row.facebook,
    priceInfo: row.price_info,
    parkingInfo: row.parking_info,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    familyFriendly: row.family_friendly,
    petFriendly: row.pet_friendly,
    accessibilityNotes: row.accessibility_notes,
    lastVerifiedAt: row.last_verified_at,
  };
}
