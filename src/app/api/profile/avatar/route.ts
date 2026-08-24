import { NextResponse } from "next/server";
import { updateOwnProfile } from "@/lib/auth/profile";
import { ALLOWED_IMAGE_TYPES, AVATAR_MAX_BYTES } from "@/lib/community/constants";
import { communityResponse, requireAuthed } from "@/lib/community/apiAuth";
import { isAllowedImageFile } from "@/lib/security/files";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAuthed();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Izaberi sliku.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !(await isAllowedImageFile(file))) {
      return NextResponse.json({ error: "Dozvoljeni su JPG, PNG i WebP.", code: "FILE_TYPE" }, { status: 400 });
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return NextResponse.json({ error: "Avatar može do 5 MB.", code: "FILE_TOO_LARGE" }, { status: 400 });
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: "Otpremanje nije uspelo.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const profile = await updateOwnProfile(supabase, user.id, { avatarUrl: url });
    return NextResponse.json({ profile });
  } catch (error) {
    return communityResponse(error);
  }
}
