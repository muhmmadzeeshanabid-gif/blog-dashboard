import { getDashboardPosts } from "../../../../lib/dashboardData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const posts = await getDashboardPosts({
    page: searchParams.get("page"),
    status: searchParams.get("status"),
    query: searchParams.get("query"),
  });

  return Response.json(posts);
}
