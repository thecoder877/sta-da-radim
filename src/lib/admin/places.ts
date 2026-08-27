import type { SupabaseClient } from "@supabase/supabase-js";
import { CommunityError } from "@/lib/community/errors";

export async function setPlacePublished(
  supabase: SupabaseClient,
  adminId: string,
  placeId: string,
  published: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("places")
    .update({
      is_published: published,
      updated_by: adminId,
    })
    .eq("id", placeId);
  if (error) {
    throw new CommunityError("Lokacija nije ažurirana.", "INVALID_REQUEST");
  }
}

export async function deleteCanonicalPlace(
  supabase: SupabaseClient,
  placeId: string,
): Promise<void> {
  const { data, error: lookupError } = await supabase
    .from("places")
    .select("id, source")
    .eq("id", placeId)
    .maybeSingle();
  if (lookupError || !data) {
    throw new CommunityError("Lokacija nije pronađena.", "NOT_FOUND", 404);
  }
  if (data.source !== "community") {
    throw new CommunityError(
      "Katalog i OSM mesta se skidaju sa sajta, ne brišu se.",
      "INVALID_REQUEST",
    );
  }
  const { error } = await supabase.from("places").delete().eq("id", placeId);
  if (error) {
    throw new CommunityError("Lokacija nije obrisana.", "INVALID_REQUEST");
  }
}
