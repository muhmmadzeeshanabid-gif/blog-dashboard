import BlogPageLayout from "@/frontend/components/layout/BlogPageLayout";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import ContactClient from "./ContactClient";
import { getAllPosts, getHomepageFeed } from "@/backend/lib/postStore";
import { getAppSettings } from "@/backend/lib/appSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us | ORIN Blog",
  description: "Have a question, suggestion, or just want to say hello? Get in touch with ORIN blog.",
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

export default async function ContactPage() {
  const [homepageFeed, allPosts, appSettings] = await Promise.all([
    getHomepageFeed(1, 4),
    getAllPosts(),
    getAppSettings()
  ]);

  const formatSlugs = {
    image: allPosts.find((p) => p.format === "image")?.slug || "",
    gallery: allPosts.find((p) => p.format === "gallery")?.slug || "",
    video: allPosts.find((p) => p.format === "video")?.slug || "",
    audio: allPosts.find((p) => p.format === "audio")?.slug || "",
  };

  return (
    <BlogPageLayout formatSlugs={formatSlugs} showSeparator={true}>
      <ContactClient initialSlides={appSettings.contactSlides} />
      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
