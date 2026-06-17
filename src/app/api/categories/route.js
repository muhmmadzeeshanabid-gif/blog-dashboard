import { getAllPosts } from "../../../lib/postStore";

export async function GET() {
  const posts = await getAllPosts();
  const catMap = {};

  posts.forEach((p) => {
    const cat = String(p.category ?? "").trim();
    if (!cat) return;

    if (!catMap[cat]) {
      catMap[cat] = new Set();
    }

    if (Array.isArray(p.tags)) {
      p.tags.forEach((tag) => {
        const normalizedTag = String(tag ?? "").trim();
        if (!normalizedTag || normalizedTag.toLowerCase() === cat.toLowerCase()) {
          return;
        }

        catMap[cat].add(normalizedTag);
      });
    }
  });

  const categories = Object.entries(catMap)
    .map(([name, tagsSet]) => ({
      name,
      subCategories: Array.from(tagsSet)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }))
        .slice(0, 6),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return Response.json(categories);
}
