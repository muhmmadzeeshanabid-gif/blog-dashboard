import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import {
  deletePostRecord,
  getPostBySlug,
  updatePostRecord,
} from "@/backend/lib/postStore";
import { appendActionNotificationCookie, createActionNotification } from "@/dashboard/lib/dashboardNotifications";

export const runtime = "nodejs";

function normalizeComparableValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isAdminUser(user) {
  return normalizeComparableValue(user?.role) === "admin";
}

function isPostOwnedByUser(post, currentUser) {
  const author = normalizeComparableValue(post?.author);
  const currentName = normalizeComparableValue(currentUser?.name);
  const currentEmail = normalizeComparableValue(currentUser?.email);

  if (!author) {
    return false;
  }

  if (currentEmail && author.includes(`<${currentEmail}>`)) {
    return true;
  }

  if (currentName && author === currentName) {
    return true;
  }

  return false;
}

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
    ? (post.gallery ?? []).filter((item) => item.isSlider || !item.isExtra)
    : (post.gallery ?? []);
  const extraImages = isGalleryFormat
    ? (post.gallery ?? []).filter((item) => item.isExtra)
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
    extraImages,
  };
}

export async function GET(_request, context) {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);
  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (!isAdminUser(currentUser) && !isPostOwnedByUser(post, currentUser)) {
    return Response.json({ error: "Forbidden. You can only view your own posts." }, { status: 403 });
  }

  return Response.json({ post: serializePost(post) });
}

export async function PUT(request, context) {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);
    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { slug } = await context.params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    if (!isAdminUser(currentUser) && !isPostOwnedByUser(post, currentUser)) {
      return Response.json({ error: "Forbidden. You can only edit your own posts." }, { status: 403 });
    }

    const formData = await request.formData();
    const source = getSourceFromFormData(formData);
    source.author = `${currentUser.name} <${currentUser.email}>`;

    if (!isAdminUser(currentUser)) {
      source.isFeatured = false;
    }

    const result = await updatePostRecord(slug, source);

    if (result.error === "Post not found.") {
      return Response.json({ error: result.error }, { status: 404 });
    }

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const notification = createActionNotification({
      type: result.post.status === "published" ? "update" : "draft",
      title:
        result.post.status === "published"
          ? `Post updated "${result.post.title}"`
          : `Draft updated "${result.post.title}"`,
      recipientEmail: currentUser.email,
    });
    await appendActionNotificationCookie(cookieStore, notification);

    return Response.json({
      message:
        result.post.status === "published"
          ? "Post updated successfully."
          : "Draft updated successfully.",
      post: serializePost(result.post),
      notification,
    });
  } catch (err) {
    console.error("[PUT /api/dashboard/posts/:slug] Unhandled error:", err?.message || err);
    return Response.json({ error: err?.message || "Internal server error while updating post." }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);
  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (!isAdminUser(currentUser) && !isPostOwnedByUser(post, currentUser)) {
    return Response.json({ error: "Forbidden. You can only delete your own posts." }, { status: 403 });
  }

  const result = await deletePostRecord(slug);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  const notification = createActionNotification({
    type: "delete",
    title: `Post deleted "${post.title}"`,
    recipientEmail: currentUser.email,
  });
  await appendActionNotificationCookie(cookieStore, notification);

  return Response.json({
    message: "Post deleted successfully.",
    deleted: {
      id: result.deleted.id,
      slug: result.deleted.slug,
      title: result.deleted.title,
    },
    notification,
  });
}