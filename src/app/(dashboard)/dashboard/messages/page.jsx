import { cookies } from "next/headers";
import { requireAdminUser } from "@/backend/lib/auth";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Messages | ORIN Dashboard",
  description: "View and manage messages sent from the contact form inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardMessagesPage() {
  const currentUser = await requireAdminUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const dashboardPosts = await getDashboardPosts({}, new Date(), currentUser);

  return (
    <MessagesClient
      navItems={getDashboardNavItems("/dashboard/messages")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}