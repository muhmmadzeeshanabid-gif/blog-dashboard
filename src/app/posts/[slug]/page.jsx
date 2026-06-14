import { notFound } from "next/navigation";
import PostDetailContent from "../../../components/post/PostDetailContent";
import { getPostBySlug, getHomepageFeed, getAdjacentPosts, getAllPosts } from "../../../lib/postStore";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  // Fetch feed, adjacent posts, and all posts in parallel
  const [homepageFeed, adjacent, allPosts] = await Promise.all([
    getHomepageFeed(1, 8),
    getAdjacentPosts(slug),
    getAllPosts()
  ]);

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

  // Dynamic slugs for post format links in the header
  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  return (
    <PostDetailContent
      post={post}
      adjacent={adjacent}
      relatedPosts={relatedPosts}
      homepageFeed={homepageFeed}
      formatSlugs={formatSlugs}
    />
  );
}
