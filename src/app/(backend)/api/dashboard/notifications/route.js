import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { getDashboardOverview } from "@/dashboard/lib/dashboardData";

export const dynamic = "force-dynamic";

function getUserCookieSuffix(currentUser) {
  return currentUser ? `_${currentUser.id || currentUser.email.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
}

function parseCookieJson(value) {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userSuffix = getUserCookieSuffix(currentUser);
    const readNotificationIds = parseCookieJson(cookieStore.get(`orin_read_notifications${userSuffix}`)?.value);
    const clearedNotificationIds = parseCookieJson(cookieStore.get(`orin_cleared_notifications${userSuffix}`)?.value);

    const overview = await getDashboardOverview(
      {
        readNotificationIds,
        clearedNotificationIds,
      },
      new Date(),
      currentUser
    );

    return Response.json(overview.notifications);
  } catch (err) {
    console.error("[GET /api/dashboard/notifications] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}