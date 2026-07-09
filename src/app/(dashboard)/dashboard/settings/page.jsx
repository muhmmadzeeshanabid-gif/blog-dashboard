import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/backend/lib/auth";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getAppSettings } from "@/backend/lib/appSettings";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | ORIN Dashboard",
  description: "Manage your profile preferences inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const initialTab = resolvedParams?.tab || "profile";
  const currentUser = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const [dashboardPosts, appSettings] = await Promise.all([
    getDashboardPosts({}, new Date(), currentUser),
    getAppSettings(),
  ]);

  return (
    <SettingsClient
      navItems={getDashboardNavItems("/dashboard/settings")}
      initialTab={initialTab}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
      initialSettings={appSettings}
    />
  );
}