import OverviewClient from "./OverviewClient";
import { getDashboardOverview } from "../../lib/dashboardData";
import { getDashboardNavItems } from "./navigation";

export const metadata = {
  title: "Overview | ORIN Dashboard",
  description: "Overview page for the ORIN blog admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialOverview = await getDashboardOverview({
    range: resolvedSearchParams?.range,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  });

  return (
    <OverviewClient
      initialOverview={initialOverview}
      navItems={getDashboardNavItems("/dashboard")}
    />
  );
}
