import { incrementPostView } from "../../../../../lib/postStore";

export async function POST(_request, { params }) {
  const { slug } = await params;
  const totalViews = await incrementPostView(slug);

  if (totalViews === null) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  return Response.json({ totalViews });
}
