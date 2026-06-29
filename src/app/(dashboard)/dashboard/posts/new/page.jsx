import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getAllPosts, getPostBySlug } from "@/backend/lib/postStore";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import PostEditorClient from "./PostEditorClient";

const DEFAULT_CATEGORIES = [
  "Minimalism",
  "Lifestyle",
  "Productivity",
  "Travel",
  "Wellness",
  "Photography",
  "Technology",
  "Food",
  "Health",
  "Finance",
  "Design",
  "Other",
];

export const metadata = {
  title: "New Post | ORIN Dashboard",
  description: "Create or edit posts inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

function sortAlphabetically(values) {
  return [...values].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );
}

function getCategoryOptions(posts, currentCategory = "") {
  const categorySet = new Set(DEFAULT_CATEGORIES);

  for (const post of posts) {
    if (post.category) {
      categorySet.add(post.category);
    }
  }

  if (currentCategory) {
    categorySet.add(currentCategory);
  }

  return sortAlphabetically([...categorySet]);
}

function serializeInitialPost(post) {
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
    gallery: Array.isArray(post.gallery) ? post.gallery : [],
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
  };
}

export default async function DashboardPostEditorPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const requestedSlug =
    typeof resolvedSearchParams?.slug === "string"
      ? resolvedSearchParams.slug.trim()
      : "";
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  let currentUser = null;
  if (userSessionCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
    } catch (e) {
      // ignore
    }
  }

  const [allPosts, dashboardPosts, currentPost] = await Promise.all([
    getAllPosts(),
    getDashboardPosts({}, new Date(), currentUser),
    requestedSlug ? getPostBySlug(requestedSlug) : Promise.resolve(null),
  ]);

  if (requestedSlug && !currentPost) {
    notFound();
  }

  if (currentPost && currentUser && currentUser.role !== "admin" && currentPost.author && currentUser.name && currentPost.author.toLowerCase() !== currentUser.name.toLowerCase()) {
    notFound();
  }

  return (
    <PostEditorClient
      mode={currentPost ? "edit" : "create"}
      initialPost={currentPost ? serializeInitialPost(currentPost) : null}
      categoryOptions={getCategoryOptions(allPosts, currentPost?.category)}
      navItems={getDashboardNavItems("/dashboard/posts")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
