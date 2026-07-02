import { cookies } from "next/headers";
import { endUserSession } from "@/backend/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    await endUserSession(cookieStore);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Logout API Error]", error);
    return Response.json({ error: error.message || "Failed to log out." }, { status: 500 });
  }
}