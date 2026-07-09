import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore, sanitizeUser } from "@/backend/lib/auth";
import { getAllUsers } from "@/backend/lib/userStore";

// Trigger hot-reload to apply sanitizeUser update
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (String(currentUser.role).toLowerCase() !== "admin") {
      return Response.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const users = await getAllUsers();
    return Response.json(users.map(sanitizeUser));
  } catch (err) {
    console.error("[Users API GET] Error fetching users:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}