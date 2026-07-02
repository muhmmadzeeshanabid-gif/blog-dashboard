import { cookies } from "next/headers";
import { requireAdminUser } from "@/backend/lib/auth";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import { getPublishedPosts } from "@/backend/lib/postStore";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { readSeededRuntimeJson } from "@/backend/lib/runtimeState";
import { getSiteAnalytics } from "@/backend/lib/siteAnalytics";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics | ORIN Dashboard",
  description: "Detailed analytics and trending reports for ORIN blog.",
};

export const dynamic = "force-dynamic";

const READ_TIME_FILE_NAME = "read-time.json";

export default async function DashboardAnalyticsPage() {
  const currentUser = await requireAdminUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const storedReadTime = await readSeededRuntimeJson(READ_TIME_FILE_NAME, {});
  const readTimeData = storedReadTime && typeof storedReadTime === "object" && !Array.isArray(storedReadTime)
    ? storedReadTime
    : {};

  const posts = await getPublishedPosts();
  const siteAnalytics = await getSiteAnalytics();
  const currentDateStr = new Date().toISOString().split("T")[0];
  const serializedPosts = posts.map((post) => {
    const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : 0;
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      image: post.image,
      totalViews: post.totalViews ?? 0,
      viewsByDate: post.viewsByDate ?? {},
      format: post.format ?? "image",
      wordCount,
      readTimeByDate: readTimeData[post.slug] || {},
    };
  });

  const dashboardPosts = await getDashboardPosts({}, new Date(), currentUser);

  return (
    <AnalyticsClient
      navItems={getDashboardNavItems("/dashboard/analytics")}
      isDarkInitial={isDarkInitial}
      posts={serializedPosts}
      siteAnalytics={siteAnalytics}
      currentDateStr={currentDateStr}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
