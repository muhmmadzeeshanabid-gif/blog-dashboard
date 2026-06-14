import RecentPosts from "../components/recent-posts/RecentPosts";
import HeroSlider from "../components/slider/HeroSlider";
import FooterWidgets from "../components/widgets/FooterWidgets";
import BlogPageLayout from "../components/layout/BlogPageLayout";
import { getHomepageFeed, getAllPosts } from "../lib/postStore";

export const dynamic = "force-dynamic";

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function mapRecentPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    format: post.format,
    isSticky: post.isSticky,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    views: String(post.totalViews ?? 0),
    comments: String(post.comments ?? 0),
    image: post.image,
    imgWidth: 1920,
    imgHeight: 1280,
    videoUrl: post.videoUrl,
    audioUrl: post.audioUrl,
    galleryImages: (post.galleryImages ?? []).map((src, index) => ({
      src,
      alt: `${post.title} image ${index + 1}`,
      title: `${post.title} * Gallery image ${index + 1}.`,
    })),
    author: post.author,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
  };
}

function mapHeroPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    image: post.image,
    author: post.author,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    category: post.category,
  };
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

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = Number.parseInt(resolvedSearchParams?.page ?? "1", 10) || 1;
  const category = resolvedSearchParams?.category ?? "";
  const tag = resolvedSearchParams?.tag ?? "";
  const s = resolvedSearchParams?.s ?? "";

  const [homepageFeed, allPosts] = await Promise.all([
    getHomepageFeed(requestedPage, 8, { category, tag, query: s }),
    getAllPosts()
  ]);

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  return (
    <BlogPageLayout formatSlugs={formatSlugs}>
      <HeroSlider heroPosts={homepageFeed.heroPosts.map(mapHeroPost)} />
      <RecentPosts
        posts={homepageFeed.recentPosts.map(mapRecentPost)}
        featuredPostId={homepageFeed.featuredPost?.id ?? null}
        currentPage={homepageFeed.currentPage}
        totalPages={homepageFeed.totalPages}
        category={category}
        tag={tag}
        searchQuery={s}
      />
      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
