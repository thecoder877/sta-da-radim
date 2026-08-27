import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { addPlacePhoto } from "@/lib/community/placePhotos";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PLACE_PHOTOS,
  PHOTO_MAX_BYTES,
} from "@/lib/community/constants";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { listVisiblePlacePhotos } from "@/lib/places/canonical";
import { getPlaceRepository } from "@/lib/providers/places";
import { isAllowedImageFile } from "@/lib/security/files";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const placeKey = new URL(request.url).searchParams.get("placeKey") ?? "";
  if (!placeKey) {
    return NextResponse.json(
      { error: "Nedostaje mesto.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
  if (!supabase) {
    return NextResponse.json({ photos: [] });
  }
  const photos = await listVisiblePlacePhotos(supabase, placeKey);
  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const form = await request.formData();
    const placeKey = String(form.get("placeKey") ?? "");
    const caption = String(form.get("caption") ?? "").trim();
    const file = form.get("file");
    if (!placeKey || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nedostaje fotografija.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const place = await getPlaceRepository().getPlaceById(placeKey);
    if (!place) {
      return NextResponse.json(
        { error: "Mesto nije pronađeno.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !(await isAllowedImageFile(file))) {
      return NextResponse.json(
        { error: "Dozvoljeni su JPG, PNG i WebP.", code: "FILE_TYPE" },
        { status: 400 },
      );
    }
    if (file.size > PHOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Fajl je prevelik.", code: "FILE_TOO_LARGE" },
        { status: 400 },
      );
    }
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/places/${place.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("place-submission-photos")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
    if (error) {
      return NextResponse.json(
        { error: "Otpremanje nije uspelo.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const photo = await addPlacePhoto(
      supabase,
      user.id,
      place,
      path,
      caption || undefined,
    );
    return NextResponse.json({ ok: true, photo, limit: MAX_PLACE_PHOTOS });
  } catch (error) {
    return communityResponse(error);
  }
}

export const maxDuration = 30;
