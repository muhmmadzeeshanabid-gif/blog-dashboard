import BlogPageLayout from "@/frontend/components/layout/BlogPageLayout";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import AboutClient from "./AboutClient";
import { getAllPosts, getHomepageFeed } from "@/backend/lib/postStore";
import { getAppSettings } from "@/backend/lib/appSettings";
import { getSiteAnalytics } from "@/backend/lib/siteAnalytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | ORIN Blog",
  description: "Learn more about ORIN blog - a space for calm, clarity, and creativity.",
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
    category: post.category,
  };
}

export default async function AboutPage() {
  const [homepageFeed, allPosts, appSettings, siteAnalytics] = await Promise.all([
    getHomepageFeed(1, 4),
    getAllPosts(),
    getAppSettings(),
    getSiteAnalytics()
  ]);

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  const publishedPosts = allPosts.filter((p) => p.status === "published");
  const articlesCount = publishedPosts.length;

  const categoriesSet = new Set(
    publishedPosts.map((p) => p.category?.trim()).filter(Boolean)
  );
  const categoriesCount = categoriesSet.size;

  const totalVisitors = Object.values(siteAnalytics || {}).reduce(
    (sum, day) => sum + (day.visitors || 0),
    0
  );

  return (
    <BlogPageLayout formatSlugs={formatSlugs} showSeparator={true}>
      <AboutClient
        initialSlides={appSettings.aboutSlides}
        articlesCount={articlesCount}
        categoriesCount={categoriesCount}
        readersCount={totalVisitors}
      />
      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
