import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const mimeType = String(file.type ?? "");
    if (!mimeType.startsWith("image/")) {
      return Response.json({ error: "Uploaded file must be an image." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name || "").toLowerCase() || ".png";
    const filename = `avatar-${Date.now()}${extension}`;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.storage
          .from("blog-media")
          .upload(`avatars/${filename}`, buffer, {
            contentType: file.type || "image/png",
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("[Avatar Upload API] Supabase storage upload error:", error);
          return Response.json({ error: error.message || "Failed to upload avatar to database storage." }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage
          .from("blog-media")
          .getPublicUrl(`avatars/${filename}`);

        return Response.json({ success: true, avatarUrl: publicUrlData?.publicUrl || "" });
      } catch (supabaseErr) {
        console.error("[Avatar Upload API] Supabase error:", supabaseErr);
        return Response.json({ error: "Failed to upload avatar to database storage." }, { status: 500 });
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      return Response.json({ success: true, avatarUrl: `/uploads/avatars/${filename}` });
    } catch (fsErr) {
      console.error("[Avatar Upload API] Local filesystem error:", fsErr);
      return Response.json({ error: "Filesystem is read-only. Please configure Supabase for live storage." }, { status: 500 });
    }
  } catch (err) {
    console.error("[Avatar Upload API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}