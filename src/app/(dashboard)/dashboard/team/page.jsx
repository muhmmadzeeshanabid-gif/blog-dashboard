import { cookies } from "next/headers";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getAppSettings } from "@/backend/lib/appSettings";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import TeamClient from "./TeamClient";

export const metadata = {
  title: "Team Management | ORIN Dashboard",
  description: "Manage team members, details, and cards inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardTeamPage() {
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

  const [dashboardPosts, appSettings] = await Promise.all([
    getDashboardPosts({}, new Date(), currentUser),
    getAppSettings(),
  ]);

  return (
    <TeamClient
      navItems={getDashboardNavItems("/dashboard/team")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
      initialTeam={appSettings.teamMembers || []}
    />
  );
}
