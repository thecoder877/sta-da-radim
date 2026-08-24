import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_PLACE_PHOTOS } from "@/lib/community/constants";
import { CommunityError } from "@/lib/community/errors";
import { ensureCanonicalPlace } from "@/lib/places/canonical";
import type { Place } from "@/types/place";

export async function addPlacePhoto(
  supabase: SupabaseClient,
  userId: string,
  place: Place,
  storagePath: string,
  caption?: string,
): Promise<{ id: string; publicUrl: string; caption?: string }> {
  const canonical = await ensureCanonicalPlace(supabase, place, userId);
  const { count } = await supabase
    .from("place_photos")
    .select("id", { count: "exact", head: true })
    .eq("place_key", place.id)
    .eq("status", "visible");
  if ((count ?? 0) >= MAX_PLACE_PHOTOS) {
    throw new CommunityError(
      `Možeš dodati najviše ${MAX_PLACE_PHOTOS} fotografija.`,
      "PHOTO_LIMIT",
    );
  }

  const { data, error } = await supabase
    .from("place_photos")
    .insert({
      place_id: canonical.id,
      place_key: place.id,
      user_id: userId,
      storage_path: storagePath,
      caption: caption || null,
      is_primary: (count ?? 0) === 0,
      source: "community",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new CommunityError("Fotografija nije sačuvana.", "INVALID_REQUEST");
  }

  return {
    id: data.id as string,
    publicUrl: supabase.storage.from("place-submission-photos").getPublicUrl(storagePath).data
      .publicUrl,
    caption: caption || undefined,
  };
}
