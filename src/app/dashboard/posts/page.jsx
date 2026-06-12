import PostsClient from "./PostsClient";
import { getDashboardPosts } from "../../../lib/dashboardData";
import { getDashboardNavItems } from "../navigation";

export const metadata = {
  title: "Posts | ORIN Dashboard",
  description: "Posts page for the ORIN blog admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPostsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialPosts = await getDashboardPosts({
    page: resolvedSearchParams?.page,
    status: resolvedSearchParams?.status,
    query: resolvedSearchParams?.query,
  });

  return (
    <PostsClient
      initialPosts={initialPosts}
      navItems={getDashboardNavItems("/dashboard/posts")}
    />
  );
}
