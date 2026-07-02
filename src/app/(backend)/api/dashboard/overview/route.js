import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { getDashboardOverview } from "@/dashboard/lib/dashboardData";

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

export async function GET(request) {
  const url = new URL(request.url);
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