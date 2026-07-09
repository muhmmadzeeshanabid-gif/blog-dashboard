import { getActiveCategories } from "@/backend/lib/categoryStore";

export async function GET() {
  const categories = await getActiveCategories();
  return Response.json(categories);
}
