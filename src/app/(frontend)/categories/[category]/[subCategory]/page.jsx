import { notFound } from "next/navigation";
import RecentPosts from "@/frontend/components/recent-posts/RecentPosts";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import BlogPageLayout from "@/frontend/components/layout/BlogPageLayout";
import { getHomepageFeed, getAllPosts } from "@/backend/lib/postStore";
import { getAppSettings } from "@/backend/lib/appSettings";

// TASK 1: ISR — subcategory pages regenerate at most every 60 seconds.
export const revalidate = 60;

function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export async function generateMetadata({ params }) {
  const { category, subCategory } = await params;
  const capitalizedCat = category ? category.split("-").map(capitalizeWord).join(" ") : "";
  const capitalizedSub = subCategory ? subCategory.split("-").map(capitalizeWord).join(" ") : "";
  return {
    title: `${capitalizedCat} - ${capitalizedSub} | ORIN Blog`,
    description: `Browse all articles under the ${capitalizedCat} - ${capitalizedSub} subcategory on ORIN Blog.`,
  };
}

function formatLongDate(date) {
  if (!date) return "";
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

export default async function SubCategoryPage({ params, searchParams }) {
  const { category, subCategory } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedPage = Number.parseInt(resolvedSearchParams?.page ?? "1", 10) || 1;

  const [appSettings, allPosts] = await Promise.all([
    getAppSettings(),
    getAllPosts()
  ]);

  // Match category slug with case-insensitive name
  const matchedPost = allPosts.find(p => p.category.toLowerCase() === category.toLowerCase());
  if (!matchedPost && category.toLowerCase() !== "all") {
    notFound();
  }

  const categoryName = matchedPost ? matchedPost.category : category;

  // Try to find matching tag in posts
  const matchedTag = allPosts.flatMap(p => p.tags || []).find(t => t.toLowerCase() === subCategory.toLowerCase());
  const tagName = matchedTag || subCategory;

  const homepageFeed = await getHomepageFeed(
    requestedPage, 
    appSettings.postsPerPage, 
    { 
      category: category.toLowerCase() === "all" ? "" : categoryName, 
      tag: tagName 
    }
  );

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  return (
    <BlogPageLayout formatSlugs={formatSlugs}>
      <RecentPosts
        posts={homepageFeed.recentPosts.map(mapRecentPost)}
        featuredPostId={homepageFeed.featuredPost?.id ?? null}
        currentPage={homepageFeed.currentPage}
        totalPages={homepageFeed.totalPages}
        category={categoryName}
        tag={tagName}
      />
      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
