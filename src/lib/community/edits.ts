import type { SupabaseClient } from "@supabase/supabase-js";
import { CommunityError } from "@/lib/community/errors";
import { ensureCanonicalPlace } from "@/lib/places/canonical";
import type { Place } from "@/types/place";
import type { PlaceEditRequest } from "@/types/community";

const FIELD_MAP: Record<string, string> = {
  opening_hours: "opening_hours",
  phone: "phone",
  website: "website",
  instagram: "instagram",
  facebook: "facebook",
  address: "address",
  price_info: "price_info",
  parking_info: "parking_info",
  estimated_duration_minutes: "estimated_duration_minutes",
  description: "description",
  short_description: "short_description",
  category: "category",
  family_friendly: "family_friendly",
  pet_friendly: "pet_friendly",
  accessibility_notes: "accessibility_notes",
  latitude: "latitude",
  longitude: "longitude",
};

export async function createEditRequest(
  supabase: SupabaseClient,
  userId: string,
  place: Place,
  fields: { fieldName: string; newValue: unknown }[],
  sourceNote?: string,
): Promise<string> {
  const canonical = await ensureCanonicalPlace(supabase, place, userId);
  const { data: request, error } = await supabase
    .from("place_edit_requests")
    .insert({
      place_id: canonical.id,
      place_key: place.id,
      user_id: userId,
      source_note: sourceNote ?? null,
    })
    .select("id")
    .single();
  if (error || !request) {
    throw new CommunityError("Predlog izmene nije poslat.", "INVALID_REQUEST");
  }

  const rows = fields
    .filter((field) => FIELD_MAP[field.fieldName])
    .map((field) => ({
      request_id: request.id,
      place_id: canonical.id,
      place_key: place.id,
      user_id: userId,
      field_name: field.fieldName,
      old_value: (canonical as unknown as Record<string, unknown>)[FIELD_MAP[field.fieldName]] ?? null,
      new_value: field.newValue,
    }));

  if (rows.length === 0) {
    throw new CommunityError("Nema validnih polja za izmenu.", "INVALID_REQUEST");
  }

  const { error: fieldError } = await supabase.from("place_edit_suggestions").insert(rows);
  if (fieldError) {
    throw new CommunityError("Predlog izmene nije poslat.", "INVALID_REQUEST");
  }
  return request.id as string;
}

export async function listOwnEdits(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlaceEditRequest[]> {
  const { data: requests } = await supabase
    .from("place_edit_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const ids = (requests ?? []).map((row) => row.id as string);
  const { data: fields } = ids.length
    ? await supabase.from("place_edit_suggestions").select("*").in("request_id", ids)
    : { data: [] };

  return (requests ?? []).map((row) => ({
    id: row.id as string,
    placeKey: row.place_key as string,
    status: row.status as PlaceEditRequest["status"],
    sourceNote: (row.source_note as string | null) ?? undefined,
    publicModeratorNote: (row.public_moderator_note as string | null) ?? undefined,
    createdAt: row.created_at as string,
    fields: (fields ?? [])
      .filter((field) => field.request_id === row.id)
      .map((field) => ({
        fieldName: field.field_name as string,
        oldValue: field.old_value,
        newValue: field.new_value,
      })),
  }));
}

export async function approveEditRequest(
  supabase: SupabaseClient,
  adminId: string,
  requestId: string,
  fieldPatches?: Record<string, unknown>,
): Promise<void> {
  const { data: request } = await supabase.from("place_edit_requests").select("*").eq("id", requestId).single();
  if (!request) {
    throw new CommunityError("Predlog nije pronađen.", "NOT_FOUND", 404);
  }
  const { data: fields } = await supabase.from("place_edit_suggestions").select("*").eq("request_id", requestId);
  const patch: Record<string, unknown> = {
    last_verified_at: new Date().toISOString(),
    updated_by: adminId,
  };
  for (const field of fields ?? []) {
    const column = FIELD_MAP[field.field_name as string];
    if (!column) {
      continue;
    }
    patch[column] = fieldPatches?.[field.field_name as string] ?? field.new_value;
  }

  const { error } = await supabase.from("places").update(patch).eq("id", request.place_id);
  if (error) {
    throw new CommunityError("Izmena nije primenjena.", "INVALID_REQUEST");
  }

  await supabase
    .from("place_edit_suggestions")
    .update({ status: "approved" })
    .eq("request_id", requestId);
  await supabase
    .from("place_edit_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", requestId);
}

export async function rejectEditRequest(
  supabase: SupabaseClient,
  adminId: string,
  requestId: string,
  publicNote?: string,
): Promise<void> {
  await supabase.from("place_edit_suggestions").update({ status: "rejected" }).eq("request_id", requestId);
  await supabase
    .from("place_edit_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      public_moderator_note: publicNote ?? null,
    })
    .eq("id", requestId);
}
