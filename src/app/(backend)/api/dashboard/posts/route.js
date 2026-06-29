import { cookies } from "next/headers";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { createPostRecord } from "@/backend/lib/postStore";
import { appendActionNotificationCookie, createActionNotification } from "@/dashboard/lib/dashboardNotifications";

export const runtime = "nodejs";

function getSourceFromFormData(formData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    status: formData.get("status"),
    format: formData.get("format"),
    imageUrl: formData.get("imageUrl"),
    videoUrl: formData.get("videoUrl"),
    audioUrl: formData.get("audioUrl"),
    tags: formData.get("tags"),
    isFeatured: formData.get("isFeatured"),
    isSticky: formData.get("isSticky"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    ogImage: formData.get("ogImage"),
    featuredImageFile: formData.get("featuredImage"),
    videoFile: formData.get("videoFile"),
    audioFile: formData.get("audioFile"),
    galleryItemsJson: formData.get("galleryItems"),
    extraImagesJson: formData.get("extraImages"),
    formDataRef: formData,
  };
}

function serializePost(post) {
  const isGalleryFormat = post.format === "gallery";
  const galleryItems = isGalleryFormat 
    ? (post.gallery ?? []).filter(item => item.isSlider || !item.isExtra)
    : (post.gallery ?? []);
  const extraImages = isGalleryFormat 
    ? (post.gallery ?? []).filter(item => item.isExtra)
    : [];

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    format: post.format,
    status: post.status,
    author: post.author,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image,
    videoUrl: post.videoUrl,
    audioUrl: post.audioUrl,
    tags: post.tags,
    comments: post.comments,
    totalViews: post.totalViews,
    isSticky: post.isSticky,
    isFeatured: post.isFeatured,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    ogImage: post.ogImage ?? "",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    gallery: galleryItems,
    extraImages: extraImages,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  let currentUser = null;
  if (userSessionCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
    } catch (e) {
      // ignore
    }
  }

  const posts = await getDashboardPosts(
    {
      page: searchParams.get("page"),
      status: searchParams.get("status"),
      query: searchParams.get("query"),
    },
    new Date(),
    currentUser
  );

  return Response.json(posts);
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userSessionCookie = cookieStore.get("orin_user_session")?.value;
    let currentUser = null;
    if (userSessionCookie) {
      try {
        currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
      } catch (e) {
        // ignore
      }
    }

    const formData = await request.formData();
    const source = getSourceFromFormData(formData);
    if (currentUser) {
      source.author = `${currentUser.name} <${currentUser.email}>`;
      if (currentUser.role !== "admin") {
        source.isFeatured = false;
      }
    }

    const result = await createPostRecord(source);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const notification = createActionNotification({
      type: result.post.status === "published" ? "publish" : "draft",
      title:
        result.post.status === "published"
          ? `Post published "${result.post.title}"`
          : `Draft saved "${result.post.title}"`,
      recipientEmail: currentUser?.email
    });
    await appendActionNotificationCookie(cookieStore, notification);

    return Response.json(
      {
        message:
          result.post.status === "published"
            ? "Post published successfully."
            : "Draft saved successfully.",
        post: serializePost(result.post),
        notification,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/dashboard/posts] Unhandled error:", err?.message || err);
    return Response.json({ error: err?.message || "Internal server error while saving post." }, { status: 500 });
  }
}
