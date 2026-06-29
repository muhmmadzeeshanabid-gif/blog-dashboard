import PostsClient from "./PostsClient";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import { cookies } from "next/headers";

export const metadata = {
  title: "Posts | ORIN Dashboard",
  description: "Posts page for the ORIN blog admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPostsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
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

  const initialPosts = await getDashboardPosts(
    {
      page: resolvedSearchParams?.page,
      status: resolvedSearchParams?.status,
      query: resolvedSearchParams?.query,
    },
    new Date(),
    currentUser
  );

  return (
    <PostsClient
      initialPosts={initialPosts}
      navItems={getDashboardNavItems("/dashboard/posts")}
      isDarkInitial={isDarkInitial}
    />
  );
}
