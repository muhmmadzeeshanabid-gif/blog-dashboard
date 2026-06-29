import { cookies } from "next/headers";
import { getDashboardPosts } from "@/dashboard/lib/dashboardData";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Messages | ORIN Dashboard",
  description: "View and manage messages sent from the contact form inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardMessagesPage() {
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
    <MessagesClient
      navItems={getDashboardNavItems("/dashboard/messages")}
      isDarkInitial={isDarkInitial}
      initialNotifications={dashboardPosts.notifications}
      initialLastUpdatedLabel={dashboardPosts.meta.lastUpdatedLabel}
    />
  );
}
