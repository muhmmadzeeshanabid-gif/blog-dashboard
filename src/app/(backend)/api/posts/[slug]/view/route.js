import { incrementPostViews } from "@/backend/lib/postStore";

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const updatedPost = await incrementPostViews(slug);
    if (!updatedPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json({ success: true, totalViews: updatedPost.totalViews });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
