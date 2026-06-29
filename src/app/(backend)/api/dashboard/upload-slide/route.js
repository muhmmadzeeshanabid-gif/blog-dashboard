import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "@/backend/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("slideImage");
    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate type
    const mimeType = String(file.type ?? "");
    if (!mimeType.startsWith("image/")) {
      return Response.json({ error: "Uploaded file must be an image." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isSupabaseConfigured) {
      // Upload to Supabase bucket "blog-media"
      const cleanFileName = (file.name || "image.png")
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .toLowerCase();
      const uploadPath = `slides/slide-${Date.now()}-${cleanFileName}`;

      const { data, error } = await supabaseAdmin.storage
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

      const imageUrl = publicUrlData?.publicUrl || "";
      return Response.json({ success: true, url: imageUrl });
    } else {
      // Local fallback
      const extension = path.extname(file.name || "").toLowerCase() || ".png";
      const filename = `slide-${Date.now()}${extension}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "slides");

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);

      const imageUrl = `/uploads/slides/${filename}`;
      return Response.json({ success: true, url: imageUrl });
    }
  } catch (err) {
    console.error("[Slide Upload API Error]", err);
    return Response.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}
