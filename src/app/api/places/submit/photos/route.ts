import { NextResponse } from "next/server";
import { requireUsername } from "@/lib/auth/profile";
import { ALLOWED_IMAGE_TYPES, MAX_SUBMISSION_PHOTOS, PHOTO_MAX_BYTES } from "@/lib/community/constants";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";

export async function POST(request: Request) {
  try {
    const { user, profile, supabase } = await requireAuthed();
    await requireUsername(profile);
    const form = await request.formData();
    const submissionId = String(form.get("submissionId") ?? "");
    const file = form.get("file");
    if (!submissionId || !(file instanceof File)) {
      return NextResponse.json({ error: "Nedostaje fotografija.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const { data: submission } = await supabase
      .from("place_submissions")
      .select("id, user_id")
      .eq("id", submissionId)
      .maybeSingle();
    if (!submission || submission.user_id !== user.id) {
      return NextResponse.json({ error: "Predlog nije pronađen.", code: "NOT_FOUND" }, { status: 404 });
    }
    const { count } = await supabase
      .from("place_submission_photos")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId);
    if ((count ?? 0) >= MAX_SUBMISSION_PHOTOS) {
      return NextResponse.json({ error: "Možeš dodati najviše 6 fotografija.", code: "PHOTO_LIMIT" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Dozvoljeni su JPG, PNG i WebP.", code: "FILE_TYPE" }, { status: 400 });
    }
    if (file.size > PHOTO_MAX_BYTES) {
      return NextResponse.json({ error: "Fajl je prevelik.", code: "FILE_TOO_LARGE" }, { status: 400 });
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${submissionId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("place-submission-photos").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: "Otpremanje nije uspelo.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    await supabase.from("place_submission_photos").insert({
      submission_id: submissionId,
      user_id: user.id,
      storage_path: path,
    });
    return NextResponse.json({ ok: true, path });
  } catch (error) {
    return communityResponse(error);
  }
}

export const maxDuration = 30;
