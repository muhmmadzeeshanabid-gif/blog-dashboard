import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { isSupabaseConfigured, supabaseAdmin } from "@/backend/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (String(currentUser.role).toLowerCase() !== "admin") {
      return Response.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("slideImage");
    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const mimeType = String(file.type ?? "");
    if (!mimeType.startsWith("image/")) {
      return Response.json({ error: "Uploaded file must be an image." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isSupabaseConfigured) {
      const cleanFileName = (file.name || "image.png")
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .toLowerCase();
      const uploadPath = `slides/slide-${Date.now()}-${cleanFileName}`;

      const { error } = await supabaseAdmin.storage
        .from("blog-media")
        .upload(uploadPath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (error) {
        console.error("[Supabase Slide Upload Error]", error);
        return Response.json({ error: error.message || "Failed to upload to Supabase." }, { status: 500 });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("blog-media")
        .getPublicUrl(uploadPath);

      return Response.json({ success: true, url: publicUrlData?.publicUrl || "" });
    }

    const extension = path.extname(file.name || "").toLowerCase() || ".png";
    const filename = `slide-${Date.now()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "slides");

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return Response.json({ success: true, url: `/uploads/slides/${filename}` });
  } catch (err) {
    console.error("[Slide Upload API Error]", err);
    return Response.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}