import { cookies } from "next/headers";
import { getDashboardNavItems } from "../navigation";
import { getPublishedPosts } from "@/lib/postStore";
import { getDashboardPosts } from "@/lib/dashboardData";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics | ORIN Dashboard",
  description: "Detailed analytics and trending reports for ORIN blog.",
};

export const dynamic = "force-dynamic";

export default async function DashboardAnalyticsPage() {
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

  const posts = await getPublishedPosts();
  const currentDateStr = new Date().toISOString().split('T')[0];
  const serializedPosts = posts.map(post => {
    const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : 0;
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      image: post.image,
      totalViews: post.totalViews ?? 0,
      viewsByDate: post.viewsByDate ?? {},
      wordCount,
    };
  });

  const dashboardPosts = await getDashboardPosts({}, new Date(), currentUser);

  return (
    <AnalyticsClient
      navItems={getDashboardNavItems("/dashboard/analytics")}
      isDarkInitial={isDarkInitial}
      posts={serializedPosts}
      currentDateStr={currentDateStr}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}

