import BlogPageLayout from "@/frontend/components/layout/BlogPageLayout";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import PrivacyPolicyClient from "./PrivacyPolicyClient";
import { getAllPosts, getHomepageFeed } from "@/backend/lib/postStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy | ORIN Blog",
  description: "Privacy Policy for ORIN - learn how we collect, use, and protect your information.",
};

function formatLongDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function mapWidgetPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    image: post.image,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    viewsLabel: String(post.totalViews ?? 0),
    commentsLabel: post.comments === 0 ? "No comments" : `${post.comments} Comments`,
    author: post.author,
  };
}

export default async function PrivacyPolicyPage() {
  const [homepageFeed, allPosts] = await Promise.all([
    getHomepageFeed(1, 4),
    getAllPosts()
  ]);

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  return (
    <BlogPageLayout formatSlugs={formatSlugs} showSeparator={true}>
      <PrivacyPolicyClient />
      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
