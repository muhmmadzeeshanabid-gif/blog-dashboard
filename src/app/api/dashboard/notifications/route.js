import { cookies } from "next/headers";
import { getDashboardOverview } from "../../../../lib/dashboardData";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userSessionCookie = cookieStore.get("orin_user_session")?.value;
    let currentUser = null;
    if (userSessionCookie) {
      try {
        currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
      } catch (e) {
        // ignore
      }
    }

    let readNotificationIds = [];
    let clearedNotificationIds = [];
    try {
      const readCookie = cookieStore.get("orin_read_notifications")?.value;
      if (readCookie) {
        readNotificationIds = JSON.parse(decodeURIComponent(readCookie));
      }
      const clearedCookie = cookieStore.get("orin_cleared_notifications")?.value;
      if (clearedCookie) {
        clearedNotificationIds = JSON.parse(decodeURIComponent(clearedCookie));
      }
    } catch (e) {
      // ignore
    }

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
