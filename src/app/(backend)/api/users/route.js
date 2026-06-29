import { getAllUsers } from "@/backend/lib/userStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (err) {
    console.error("[Users API GET] Error fetching users:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
