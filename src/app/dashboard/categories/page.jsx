import CategoriesClient from "./CategoriesClient";
import { getDashboardNavItems } from "../navigation";
import { cookies } from "next/headers";
import { getAllPosts } from "../../../lib/postStore";
import { getDashboardPosts } from "../../../lib/dashboardData";

export const metadata = {
  title: "Categories | ORIN Dashboard",
  description: "Manage blog categories in the ORIN admin dashboard.",
};

export const dynamic = "force-dynamic";

async function getCategoriesData() {
  const posts = await getAllPosts();

  const catMap = {};
  posts.forEach((post) => {
    const cat = post.category;
    if (!cat) return;
    if (!catMap[cat]) {
      catMap[cat] = { published: 0, draft: 0, tags: new Set(), latestDate: null };
    }
    if (post.status === "published") {
      catMap[cat].published += 1;
      const date = post.publishedAtDate || post.createdAtDate;
      if (date && (!catMap[cat].latestDate || date > catMap[cat].latestDate)) {
        catMap[cat].latestDate = date;
      }
    } else {
      catMap[cat].draft += 1;
    }
    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        if (tag && tag.toLowerCase() !== cat.toLowerCase()) {
          catMap[cat].tags.add(tag.charAt(0).toUpperCase() + tag.slice(1));
        }
      });
    }
  });

  const categories = Object.entries(catMap)
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      published: data.published,
      draft: data.draft,
      total: data.published + data.draft,
      tags: Array.from(data.tags).slice(0, 5),
      latestDate: data.latestDate ? data.latestDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    }))
    .sort((a, b) => b.total - a.total);

  const totalPosts = posts.length;
  const totalPublished = posts.filter((p) => p.status === "published").length;
  const totalDraft = posts.filter((p) => p.status === "draft").length;

  return { categories, totalPosts, totalPublished, totalDraft };
}

export default async function DashboardCategoriesPage() {
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";
  const data = await getCategoriesData();

  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  let currentUser = null;
  if (userSessionCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
    } catch (e) {
      // ignore
    }
  }

  const dashboardPosts = await getDashboardPosts({}, new Date(), currentUser);

  return (
    <CategoriesClient
      initialData={data}
      navItems={getDashboardNavItems("/dashboard/categories")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
