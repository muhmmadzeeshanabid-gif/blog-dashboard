import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { supabaseAdmin } from "@/backend/lib/supabase";

export const runtime = "nodejs";

const BUCKET_NAME = "blog-media";

const MEDIA_KIND_CONFIG = {
  image: {
    mimePrefix: "image/",
    fallbackExtension: "jpg",
    maxBytes: 40 * 1024 * 1024,
  },
  video: {
    mimePrefix: "video/",
    fallbackExtension: "mp4",
    maxBytes: 500 * 1024 * 1024,
  },
  audio: {
    mimePrefix: "audio/",
    fallbackExtension: "mp3",
    maxBytes: 200 * 1024 * 1024,
  },
};

function sanitizeSegment(value, fallback = "post") {
  return (
    String(value || fallback)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || fallback
  );
}

function getFileExtension(fileName, mediaKind) {
  const extension = String(fileName || "")
    .split(".")
    .pop()
    ?.toLowerCase()
    ?.replace(/[^a-z0-9]/g, "");

  if (extension) {
    return extension;
  }

  return MEDIA_KIND_CONFIG[mediaKind]?.fallbackExtension || "bin";
}

function formatMaxSizeLabel(bytes) {
  const megaBytes = bytes / (1024 * 1024);
  return `${megaBytes.toFixed(0)}MB`;
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);
    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const slug = String(payload?.slug || "post");
    const mediaKind = String(payload?.mediaKind || "image");
    const fileName = String(payload?.fileName || "");
    const contentType = String(payload?.contentType || "");
    const fileSize = Number(payload?.fileSize || 0);
    const config = MEDIA_KIND_CONFIG[mediaKind];

    if (!config) {
      return Response.json({ error: "Unsupported media type." }, { status: 400 });
    }

    if (!contentType.startsWith(config.mimePrefix)) {
      return Response.json({ error: "Invalid file type for this media field." }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return Response.json({ error: "Invalid file size." }, { status: 400 });
    }

    if (fileSize > config.maxBytes) {
      return Response.json(
        {
          error: `This ${mediaKind} file is too large. Maximum supported size is ${formatMaxSizeLabel(config.maxBytes)}.`,
        },
        { status: 413 }
      );
    }

    const safeSlug = sanitizeSegment(slug);
    const safeBaseName = sanitizeSegment(fileName.replace(/\.[^.]+$/, ""), mediaKind);
    const extension = getFileExtension(fileName, mediaKind);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const path = `posts/${safeSlug}/${safeBaseName}-${mediaKind}-${Date.now()}-${randomSuffix}.${extension}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      console.error("Supabase signed upload URL error:", error);
      return Response.json({ error: error?.message || "Unable to prepare upload." }, { status: 400 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);

    return Response.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      url: publicUrlData?.publicUrl || "",
    });
  } catch (error) {
    console.error("Upload route failed:", error);
    return Response.json({ error: "Unable to prepare upload." }, { status: 500 });
  }
}