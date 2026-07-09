import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { getDashboardOverview } from "@/dashboard/lib/dashboardData";
import ClientLayout from "./ClientLayout";

function getUserCookieSuffix(currentUser) {
  return currentUser ? `_${currentUser.id || currentUser.email.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
}

function parseCookieJson(value) {
  if (!value) return [];
  try { return JSON.parse(decodeURIComponent(value)); }
  catch {
    try { return JSON.parse(value); }
    catch { return []; }
  }
}

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);
  
  let initialNotifications = [];
  let initialUnreadCount = 0;

  if (currentUser) {
    const userSuffix = getUserCookieSuffix(currentUser);
    const readNotificationIds = parseCookieJson(cookieStore.get(`orin_read_notifications${userSuffix}`)?.value);
    const clearedNotificationIds = parseCookieJson(cookieStore.get(`orin_cleared_notifications${userSuffix}`)?.value);
    
    try {
      const overview = await getDashboardOverview(
        { readNotificationIds, clearedNotificationIds },
        new Date(),
        currentUser
      );
      initialNotifications = overview.notifications || [];
      initialUnreadCount = initialNotifications.filter(n => n.unread).length;
    } catch (err) {
      console.error("[DashboardLayout] Error fetching notifications:", err.message);
    }
  }

  return (
    <ClientLayout initialNotifications={initialNotifications} initialUnreadCount={initialUnreadCount}>
      {children}
    </ClientLayout>
  );
}
