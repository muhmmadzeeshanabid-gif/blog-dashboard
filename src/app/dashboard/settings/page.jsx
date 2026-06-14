import { cookies } from "next/headers";
import { getDashboardPosts } from "../../../lib/dashboardData";
import { getDashboardNavItems } from "../navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | ORIN Dashboard",
  description: "Manage your profile preferences inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const userSessionCookie = cookieStore.get("orin_user_session")?.value;
  let currentUser = null;
  if (userSessionCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userSessionCookie));
    } catch (e) {
      // ignore
    }
  }

  const dashboardPosts = await getDashboardPosts({}, new Date(), currentUser);

  return (
    <SettingsClient
      navItems={getDashboardNavItems("/dashboard/settings")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
