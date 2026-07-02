import RecentPosts from "@/frontend/components/recent-posts/RecentPosts";
import HeroSlider from "@/frontend/components/slider/HeroSlider";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import BlogPageLayout from "@/frontend/components/layout/BlogPageLayout";
import { getHomepageFeed, getAllPosts } from "@/backend/lib/postStore";
import { getAppSettings } from "@/backend/lib/appSettings";

// TASK 1: Changed revalidate from 0 to 60 (ISR — Incremental Static Regeneration).
// Blog posts don't update every second. 60s cache = 60x fewer server renders under traffic.
// Pages stay fresh within 1 minute of any content change.
export const revalidate = 60;

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

  const [appSettings, allPosts] = await Promise.all([
    getAppSettings(),
    getAllPosts()
  ]);
  const homepageFeed = await getHomepageFeed(requestedPage, appSettings.postsPerPage, { category, tag, query: s });

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  const customSlides = (appSettings.homeSlides || []).map((slide, idx) => {
    const cleanLink = String(slide.link || "")
      .replace(/^\/posts\//, "")
      .replace(/^\/+|\/+$/g, "")
      .trim();
    const post = allPosts.find((p) => p.slug === cleanLink);
    return {
      id: `home-slide-${idx}`,
      image: post ? post.image : slide.image,
      title: post ? post.title : slide.title,
      author: post ? post.author : slide.author,
      dateLabel: post ? formatLongDate(post.publishedAtDate ?? post.updatedAtDate) : slide.date,
      category: post ? post.category : slide.label,
      slug: slide.link,
      isCustomLink: true
    };
  });

  let resolvedHeroSlides = customSlides;

  if (resolvedHeroSlides.length === 0) {
    const customSlugs = new Set(customSlides.map((s) => s.slug).filter(Boolean));
    const featuredPosts = allPosts
      .filter((post) => post.status === "published" && post.isFeatured)
      .map(mapHeroPost)
      .filter((p) => !customSlugs.has(p.slug) && !customSlugs.has(`/posts/${p.slug}`));

    resolvedHeroSlides = [...customSlides, ...featuredPosts];
  }

  if (resolvedHeroSlides.length === 0) {
    resolvedHeroSlides = allPosts
      .filter((post) => post.status === "published")
      .slice(0, 4)
      .map(mapHeroPost);
  }

  return (
    <BlogPageLayout formatSlugs={formatSlugs}>
      {!category && !tag && !s && (
        <HeroSlider heroPosts={resolvedHeroSlides} />
      )}
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
