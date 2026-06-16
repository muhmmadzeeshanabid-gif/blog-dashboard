import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate type
    const mimeType = String(file.type ?? "");
    if (!mimeType.startsWith("image/")) {
      return Response.json({ error: "Uploaded file must be an image." }, { status: 400 });
    }

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name || "").toLowerCase() || ".png";
    const filename = `avatar-${Date.now()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    return Response.json({ success: true, avatarUrl });
  } catch (err) {
    console.error("[Avatar Upload API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
