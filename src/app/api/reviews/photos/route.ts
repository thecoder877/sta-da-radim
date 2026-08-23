import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { ALLOWED_IMAGE_TYPES, PHOTO_MAX_BYTES } from "@/lib/community/constants";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { addReviewPhoto, getOwnReviewId } from "@/lib/community/reviews";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const form = await request.formData();
    const placeKey = String(form.get("placeKey") ?? "");
    const file = form.get("file");
    if (!placeKey || !(file instanceof File)) {
      return NextResponse.json({ error: "Nedostaje fotografija.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Dozvoljeni su JPG, PNG i WebP.", code: "FILE_TYPE" }, { status: 400 });
    }
    if (file.size > PHOTO_MAX_BYTES) {
      return NextResponse.json({ error: "Fajl je prevelik.", code: "FILE_TOO_LARGE" }, { status: 400 });
    }
    const reviewId = await getOwnReviewId(supabase, user.id, placeKey);
    if (!reviewId) {
      return NextResponse.json({ error: "Prvo objavi recenziju.", code: "NOT_FOUND" }, { status: 404 });
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${reviewId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("review-photos").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: "Otpremanje nije uspelo.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    await addReviewPhoto(supabase, user.id, reviewId, path);
    return NextResponse.json({ ok: true, path });
  } catch (error) {
    return communityResponse(error);
  }
}

export const maxDuration = 30;
