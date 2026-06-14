import { cookies } from "next/headers";
import {
  deletePostRecord,
  getPostBySlug,
  updatePostRecord,
} from "../../../../../lib/postStore";

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
    featuredImageFile: formData.get("featuredImage"),
    videoFile: formData.get("videoFile"),
    audioFile: formData.get("audioFile"),
    galleryItemsJson: formData.get("galleryItems"),
    formDataRef: formData,
  };
}

function serializePost(post) {
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
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    gallery: post.gallery ?? [],
  };
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  if (!userSessionCookie) return null;
  try {
    return JSON.parse(decodeURIComponent(userSessionCookie));
  } catch (e) {
    return null;
  }
}

export async function GET(_request, context) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (currentUser.role !== "admin" && post.author.toLowerCase() !== currentUser.name.toLowerCase()) {
    return Response.json({ error: "Forbidden. You can only view your own posts." }, { status: 403 });
  }

  return Response.json({ post: serializePost(post) });
}

export async function PUT(request, context) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (currentUser.role !== "admin" && post.author.toLowerCase() !== currentUser.name.toLowerCase()) {
    return Response.json({ error: "Forbidden. You can only edit your own posts." }, { status: 403 });
  }

  const formData = await request.formData();
  const result = await updatePostRecord(slug, getSourceFromFormData(formData));

  if (result.error === "Post not found.") {
    return Response.json({ error: result.error }, { status: 404 });
  }

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({
    message:
      result.post.status === "published"
        ? "Post updated successfully."
        : "Draft updated successfully.",
    post: serializePost(result.post),
  });
}

export async function DELETE(_request, context) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (currentUser.role !== "admin" && post.author.toLowerCase() !== currentUser.name.toLowerCase()) {
    return Response.json({ error: "Forbidden. You can only delete your own posts." }, { status: 403 });
  }

  const result = await deletePostRecord(slug);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({
    message: "Post deleted successfully.",
    deleted: {
      id: result.deleted.id,
      slug: result.deleted.slug,
      title: result.deleted.title,
    },
  });
}
