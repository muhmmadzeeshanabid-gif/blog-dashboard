import { cookies } from "next/headers";
import { getDashboardPosts } from "../../../lib/dashboardData";
import { getDashboardNavItems } from "../navigation";
import UsersClient from "./UsersClient";

export const metadata = {
  title: "Users | ORIN Dashboard",
  description: "View and manage users, roles, and permissions inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
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
    <UsersClient
      navItems={getDashboardNavItems("/dashboard/users")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
