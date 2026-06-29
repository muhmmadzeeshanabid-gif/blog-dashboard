import { getPublishedPosts } from "@/backend/lib/postStore";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    if (!query) {
      return Response.json([]);
    }

    const posts = await getPublishedPosts();
    const filtered = posts.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const excerpt = (p.excerpt || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";

      return (
        title.includes(query) ||
        excerpt.includes(query) ||
        category.includes(query) ||
        tags.includes(query)
      );
    });

    // Return first 5 matches
    return Response.json(filtered.slice(0, 5));
  } catch (error) {
    console.error("Error in public search API:", error);
    return Response.json({ error: "Failed to search posts" }, { status: 500 });
  }
}
