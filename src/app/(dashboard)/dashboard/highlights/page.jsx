import { cookies } from "next/headers";
import { requireAdminUser } from "@/backend/lib/auth";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getAppSettings } from "@/backend/lib/appSettings";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import { getAllPosts, getHomepageFeed } from "@/backend/lib/postStore";
import HighlightsClient from "./HighlightsClient";

export const metadata = {
  title: "Sliders & Widgets | ORIN Dashboard",
  description: "Manage homepage highlights, widgets, and sliders.",
};

export const dynamic = "force-dynamic";

function formatLongDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return "";
  }
}

export default async function DashboardHighlightsPage() {
  const currentUser = await requireAdminUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const [dashboardPosts, appSettings, allPosts] = await Promise.all([
    getDashboardPosts({}, new Date(), currentUser),
    getAppSettings(),
    getAllPosts(),
  ]);

  const homepageFeed = await getHomepageFeed(1, appSettings.postsPerPage || 8);

  const simplifiedPosts = allPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category || "General",
    status: post.status || "draft",
    image: post.image || "",
    publishedAt: post.publishedAtDate || post.updatedAtDate || "",
    isFeatured: post.isFeatured || false,
    author: post.author || "Admin",
  }));

  const defaultHeroPostSlugs = homepageFeed.heroPosts.map((post) => post.slug);
  const defaultPopularPostSlugs = homepageFeed.popularPosts.map((post) => post.slug);
  const defaultRandomPostSlugs = homepageFeed.randomPosts.map((post) => post.slug);

  const defaultHomeSlides = homepageFeed.heroPosts.map((post) => ({
    image: post.image || "",
    label: post.category || "General",
    title: post.title || "",
    author: post.author || "Admin",
    date: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    buttonText: "Read More",
    link: post.slug || "",
  }));

  return (
    <HighlightsClient
      navItems={getDashboardNavItems("/dashboard/highlights")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialSettings={appSettings}
      posts={simplifiedPosts}
      defaultHeroPostSlugs={defaultHeroPostSlugs}
      defaultPopularPostSlugs={defaultPopularPostSlugs}
      defaultRandomPostSlugs={defaultRandomPostSlugs}
      defaultHomeSlides={defaultHomeSlides}
    />
  );
}