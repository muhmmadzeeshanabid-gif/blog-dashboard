import { getPublishedPosts } from "../../../lib/postStore";

export async function GET() {
  const posts = await getPublishedPosts();
  const catMap = {};

  posts.forEach(p => {
    const cat = p.category;
    if (!cat) return;

    if (!catMap[cat]) {
      catMap[cat] = new Set();
    }

    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach(tag => {
        if (tag.toLowerCase() !== cat.toLowerCase()) {
          const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
          catMap[cat].add(capitalized);
        }
      });
    }
  });

  const categories = Object.entries(catMap).map(([name, tagsSet]) => ({
    name,
    subCategories: Array.from(tagsSet).slice(0, 4)
  })).sort((a, b) => a.name.localeCompare(b.name));

  return Response.json(categories);
}
