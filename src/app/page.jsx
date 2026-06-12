import Footer from "../components/footer/Footer";
import Header from "../components/header/Header";
import Logo from "../components/logo/Logo";
import RecentPosts from "../components/recent-posts/RecentPosts";
import HeroSlider from "../components/slider/HeroSlider";
import ScrollTop from "../components/utils/ScrollTop";
import GalleryLightbox from "../components/utils/GalleryLightbox";
import FooterWidgets from "../components/widgets/FooterWidgets";
import { getHomepageFeed } from "../lib/postStore";

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
    galleryImages: (post.galleryImages ?? []).map((src, index) => ({
      src,
      alt: `${post.title} image ${index + 1}`,
      title: `${post.title} * Gallery image ${index + 1}.`,
    })),
    author: post.author,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    permalink: `/posts/${post.slug}`,
  };
}

function mapHeroPost(post) {
  return {
    id: post.id,
    title: post.title,
    image: post.image,
    author: post.author,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    category: post.category,
    permalink: `/posts/${post.slug}`,
  };
}

function mapWidgetPost(post) {
  return {
    id: post.id,
    title: post.title,
    image: post.image,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    viewsLabel: String(post.totalViews ?? 0),
    commentsLabel: post.comments === 0 ? "No comments" : `${post.comments} Comments`,
    author: post.author,
    permalink: `/posts/${post.slug}`,
  };
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = Number.parseInt(resolvedSearchParams?.page ?? "1", 10) || 1;
  const homepageFeed = await getHomepageFeed(requestedPage);

  return (
    <>
      <Header />

      <div className="bwp-site-content">
        <div className="container">
          <Logo />
          <HeroSlider heroPosts={homepageFeed.heroPosts.map(mapHeroPost)} />
          <RecentPosts
            posts={homepageFeed.recentPosts.map(mapRecentPost)}
            featuredPostId={homepageFeed.featuredPost?.id ?? null}
            currentPage={homepageFeed.currentPage}
            totalPages={homepageFeed.totalPages}
          />
          <FooterWidgets
            popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
            randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
          />
        </div>
      </div>

      <Footer />

      <ScrollTop />
      <GalleryLightbox />
    </>
  );
}
