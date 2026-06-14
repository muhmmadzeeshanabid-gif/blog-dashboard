import OverviewClient from "./OverviewClient";
import { getDashboardOverview } from "../../lib/dashboardData";
import { getDashboardNavItems } from "./navigation";
import { cookies } from "next/headers";

export const metadata = {
  title: "Overview | ORIN Dashboard",
  description: "Overview page for the ORIN blog admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
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

  const initialOverview = await getDashboardOverview(
    {
      range: resolvedSearchParams?.range,
      from: resolvedSearchParams?.from,
      to: resolvedSearchParams?.to,
    },
    new Date(),
    currentUser
  );

  return (
    <OverviewClient
      initialOverview={initialOverview}
      navItems={getDashboardNavItems("/dashboard")}
      isDarkInitial={isDarkInitial}
    />
  );
}
