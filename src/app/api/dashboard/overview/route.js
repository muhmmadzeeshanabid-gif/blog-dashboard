import { cookies } from "next/headers";
import { getDashboardOverview } from "../../../../lib/dashboardData";

export async function GET(request) {
  const url = new URL(request.url);
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

  const readNotificationsCookie = cookieStore.get("orin_read_notifications")?.value;
  const clearedNotificationsCookie = cookieStore.get("orin_cleared_notifications")?.value;

  let readNotificationIds = [];
  let clearedNotificationIds = [];
  try {
    if (readNotificationsCookie) readNotificationIds = JSON.parse(readNotificationsCookie);
    if (clearedNotificationsCookie) clearedNotificationIds = JSON.parse(clearedNotificationsCookie);
  } catch (e) {
    // ignore
  }

  const overview = await getDashboardOverview(
    {
      range: url.searchParams.get("range") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      focusDate: url.searchParams.get("focusDate") ?? undefined,
      readNotificationIds,
      clearedNotificationIds,
    },
    new Date(),
    currentUser
  );

  return Response.json(overview);
}
