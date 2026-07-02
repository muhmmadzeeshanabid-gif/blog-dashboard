import { cookies } from "next/headers";
import { requireAdminUser } from "@/backend/lib/auth";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import UsersClient from "./UsersClient";

export const metadata = {
  title: "Users | ORIN Dashboard",
  description: "View and manage users, roles, and permissions inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
  const currentUser = await requireAdminUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

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