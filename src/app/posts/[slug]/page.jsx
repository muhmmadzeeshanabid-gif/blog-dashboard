import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import PostDetailContent from "../../../components/post/PostDetailContent";
import { getPostBySlug, getHomepageFeed, getAdjacentPosts, getAllPosts } from "../../../lib/postStore";
import { getAppSettings } from "../../../lib/appSettings";

export const dynamic = "force-dynamic";

// Generate dynamic SEO metadata for each post
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourwebsite.com";
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const ogImageUrl = post.ogImage || post.image;
  const canonicalUrl = `${siteUrl}/posts/${post.slug}`;

  // Resolve absolute OG image URL
  const absoluteOgImage = ogImageUrl?.startsWith("http")
    ? ogImageUrl
    : ogImageUrl
    ? `${siteUrl}${ogImageUrl}`
    : null;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      ...(absoluteOgImage && {
        images: [{ url: absoluteOgImage, alt: title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(absoluteOgImage && { images: [absoluteOgImage] }),
    },
  };
}

export default async function PostDetailPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  // Fetch feed, adjacent posts, and all posts in parallel
  const [homepageFeed, adjacent, allPosts, appSettings] = await Promise.all([
    getHomepageFeed(1, 8),
    getAdjacentPosts(slug),
    getAllPosts(),
    getAppSettings()
  ]);

  console.log("=== SLUG PAGE SETTINGS ===", appSettings);

  const publishedPosts = allPosts.filter((p) => p.status === "published" && p.publishedAt);

  // Query up to 3 related posts (same category first, fall back to others if needed)
  const relatedPosts = publishedPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);
  if (relatedPosts.length < 3) {
    const fallback = publishedPosts.filter(
      (p) => p.slug !== post.slug && !relatedPosts.some((r) => r.slug === p.slug)
    );
    relatedPosts.push(...fallback.slice(0, 3 - relatedPosts.length));
  }

  // Get top 3 popular posts sorted by totalViews
  const popularPosts = [...publishedPosts]
    .sort((a, b) => (b.totalViews ?? 0) - (a.totalViews ?? 0))
    .slice(0, 3);

  // Get 3 random posts excluding current post
  const otherPosts = publishedPosts.filter((p) => p.slug !== post.slug);
  const randomPosts = [...otherPosts]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  // Dynamic slugs for post format links in the header
  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  // Fetch users list to query biography/avatar details
  let users = [];
  try {
    const usersFilePath = path.join(process.cwd(), "data", "users.json");
    const fileData = await fs.readFile(usersFilePath, "utf8");
    users = JSON.parse(fileData);
  } catch (err) {
    // Ignore, empty users
  }

  const postAuthor = users.find(
    (u) =>
      u.name.toLowerCase() === post.author.toLowerCase() ||
      (post.author === "Admin" && u.email === "admin@orin.com")
  );

  const authorData = {
    name: postAuthor?.name || post.author,
    avatar: postAuthor?.avatar || "https://secure.gravatar.com/avatar/602f3bb4e42cc75168bc6a987cf48ca3?s=100&d=mm&r=g",
    bio: postAuthor?.bio || "Developer of WordPress themes and writer of minimalist stories.",
    postsCount: publishedPosts.filter((p) => p.author === post.author).length,
  };

  return (
    <PostDetailContent
      post={post}
      adjacent={adjacent}
      relatedPosts={relatedPosts}
      homepageFeed={homepageFeed}
      formatSlugs={formatSlugs}
      authorData={authorData}
      appSettings={appSettings}
      popularPosts={popularPosts}
      randomPosts={randomPosts}
    />
  );
}
