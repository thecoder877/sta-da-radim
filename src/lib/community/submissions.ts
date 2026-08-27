import type { SupabaseClient } from "@supabase/supabase-js";
import { CommunityError } from "@/lib/community/errors";
import { slugify } from "@/lib/format";
import type { PlaceSubmissionInput, PlaceSubmissionRecord } from "@/types/community";

export async function createPlaceSubmission(
  supabase: SupabaseClient,
  userId: string,
  input: PlaceSubmissionInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("place_submissions")
    .insert({
      user_id: userId,
      name: input.name,
      short_description: input.shortDescription,
      description: input.description ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      category: input.category,
      opening_hours: input.openingHours ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      facebook: input.facebook ?? null,
      price_info: input.priceInfo ?? null,
      parking_info: input.parkingInfo ?? null,
      estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
      indoor: input.indoor ?? null,
      outdoor: input.outdoor ?? null,
      family_friendly: input.familyFriendly ?? null,
      pet_friendly: input.petFriendly ?? null,
      accessibility_notes: input.accessibilityNotes ?? null,
      tags: input.tags ?? [],
      source_note: input.sourceNote ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new CommunityError("Predlog nije poslat.", "INVALID_REQUEST");
  }
  return data.id as string;
}

export async function listOwnSubmissions(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlaceSubmissionRecord[]> {
  const { data } = await supabase
    .from("place_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    shortDescription: row.short_description as string,
    description: (row.description as string | null) ?? undefined,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    address: (row.address as string | null) ?? undefined,
    city: (row.city as string | null) ?? undefined,
    region: (row.region as string | null) ?? undefined,
    category: row.category as string,
    openingHours: (row.opening_hours as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    website: (row.website as string | null) ?? undefined,
    instagram: (row.instagram as string | null) ?? undefined,
    facebook: (row.facebook as string | null) ?? undefined,
    priceInfo: (row.price_info as string | null) ?? undefined,
    parkingInfo: (row.parking_info as string | null) ?? undefined,
    estimatedDurationMinutes:
      (row.estimated_duration_minutes as number | null) ?? undefined,
    indoor: (row.indoor as boolean | null) ?? undefined,
    outdoor: (row.outdoor as boolean | null) ?? undefined,
    familyFriendly: (row.family_friendly as boolean | null) ?? undefined,
    petFriendly: (row.pet_friendly as boolean | null) ?? undefined,
    accessibilityNotes: (row.accessibility_notes as string | null) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    sourceNote: (row.source_note as string | null) ?? undefined,
    status: row.status as PlaceSubmissionRecord["status"],
    publicModeratorNote: (row.public_moderator_note as string | null) ?? undefined,
    createdAt: row.created_at as string,
    reviewedAt: (row.reviewed_at as string | null) ?? undefined,
    photoUrls: [],
  }));
}

export async function approveSubmission(
  supabase: SupabaseClient,
  adminId: string,
  submissionId: string,
  patch?: Partial<PlaceSubmissionInput>,
): Promise<string> {
  const { data: submission, error } = await supabase
    .from("place_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();
  if (error || !submission) {
    throw new CommunityError("Predlog nije pronađen.", "NOT_FOUND", 404);
  }

  const name = patch?.name ?? (submission.name as string);
  const placeId = crypto.randomUUID();
  const placeKey = `community-${placeId}`;
  const slug = `${slugify(name)}-${placeId.slice(0, 8)}`;

  const { data: place, error: placeError } = await supabase
    .from("places")
    .insert({
      id: placeId,
      place_key: placeKey,
      source: "community",
      external_id: placeKey,
      slug,
      name,
      short_description: patch?.shortDescription ?? submission.short_description,
      description: patch?.description ?? submission.description,
      latitude: patch?.latitude ?? submission.latitude,
      longitude: patch?.longitude ?? submission.longitude,
      address: patch?.address ?? submission.address,
      city: patch?.city ?? submission.city,
      region: patch?.region ?? submission.region,
      category: patch?.category ?? submission.category,
      opening_hours: patch?.openingHours ?? submission.opening_hours,
      phone: patch?.phone ?? submission.phone,
      website: patch?.website ?? submission.website,
      instagram: patch?.instagram ?? submission.instagram,
      facebook: patch?.facebook ?? submission.facebook,
      price_info: patch?.priceInfo ?? submission.price_info,
      parking_info: patch?.parkingInfo ?? submission.parking_info,
      estimated_duration_minutes:
        patch?.estimatedDurationMinutes ?? submission.estimated_duration_minutes,
      environment:
        (patch?.indoor && patch?.outdoor) || (submission.indoor && submission.outdoor)
          ? "mixed"
          : patch?.indoor || submission.indoor
            ? "indoor"
            : patch?.outdoor || submission.outdoor
              ? "outdoor"
              : null,
      family_friendly: patch?.familyFriendly ?? submission.family_friendly,
      pet_friendly: patch?.petFriendly ?? submission.pet_friendly,
      accessibility_notes: patch?.accessibilityNotes ?? submission.accessibility_notes,
      tags: patch?.tags ?? submission.tags ?? [],
      last_verified_at: new Date().toISOString(),
      is_published: true,
      created_by: submission.user_id,
      updated_by: adminId,
    })
    .select("id")
    .single();

  if (placeError || !place) {
    throw new CommunityError("Mesto nije odobreno.", "INVALID_REQUEST");
  }

  const { data: photos } = await supabase
    .from("place_submission_photos")
    .select("*")
    .eq("submission_id", submissionId);

  if (photos?.length) {
    await supabase.from("place_photos").insert(
      photos.map((photo, index) => ({
        place_id: place.id,
        place_key: placeKey,
        user_id: photo.user_id,
        storage_path: photo.storage_path,
        caption: photo.caption,
        is_primary: index === 0,
        source: "submission",
      })),
    );
  }

  await supabase
    .from("place_submissions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      approved_place_id: place.id,
    })
    .eq("id", submissionId);

  return slug;
}

export async function rejectSubmission(
  supabase: SupabaseClient,
  adminId: string,
  submissionId: string,
  publicNote?: string,
  moderatorNote?: string,
): Promise<void> {
  const { error } = await supabase
    .from("place_submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      public_moderator_note: publicNote ?? null,
      moderator_note: moderatorNote ?? null,
    })
    .eq("id", submissionId);
  if (error) {
    throw new CommunityError("Odbijanje nije uspelo.", "INVALID_REQUEST");
  }
}
