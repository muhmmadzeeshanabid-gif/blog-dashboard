import { cookies } from "next/headers";
import { getDashboardPosts } from "../../../lib/dashboardData";
import { getAppSettings } from "../../../lib/appSettings";
import { getDashboardNavItems } from "../navigation";
import { getAllPosts, getHomepageFeed } from "../../../lib/postStore";
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
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  let currentUser = null;
  if (userSessionCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
    } catch (e) {
      // ignore
    }
  }

  const [dashboardPosts, appSettings, allPosts] = await Promise.all([
    getDashboardPosts({}, new Date(), currentUser),
    getAppSettings(),
    getAllPosts(),
  ]);

  const homepageFeed = await getHomepageFeed(1, appSettings.postsPerPage || 8);

  // Only pass basic fields of posts to keep response lightweight
  const simplifiedPosts = allPosts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category || "General",
    status: post.status || "draft",
    image: post.image || "",
    publishedAt: post.publishedAtDate || post.updatedAtDate || ""
  }));

  // Resolve default slides and widget slugs
  const defaultHeroPostSlugs = homepageFeed.heroPosts.map((p) => p.slug);
  const defaultPopularPostSlugs = homepageFeed.popularPosts.map((p) => p.slug);
  const defaultRandomPostSlugs = homepageFeed.randomPosts.map((p) => p.slug);

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
