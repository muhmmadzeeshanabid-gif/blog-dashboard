import { cookies } from "next/headers";
import { getDashboardPosts } from "../../../../lib/dashboardData";
import { createPostRecord } from "../../../../lib/postStore";

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
    source.author = currentUser.name;
  }

  const result = await createPostRecord(source);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(
    {
      message:
        result.post.status === "published"
          ? "Post published successfully."
          : "Draft saved successfully.",
      post: serializePost(result.post),
    },
    { status: 201 }
  );
}
