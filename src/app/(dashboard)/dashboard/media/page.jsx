import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/backend/lib/auth";
import { getDashboardMedia } from "@/dashboard/lib/dashboardData";
import { getDashboardNavItems } from "@/dashboard/lib/navigation";
import MediaClient from "./MediaClient";

export const metadata = {
  title: "Media | ORIN Dashboard",
  description: "Browse uploads, gallery assets, and media storage inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardMediaPage() {
  const currentUser = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDarkInitial = theme === "dark";

  const mediaData = await getDashboardMedia({}, new Date(), currentUser);

  return (
    <MediaClient
      initialMedia={mediaData}
      navItems={getDashboardNavItems("/dashboard/media")}
      isDarkInitial={isDarkInitial}
    />
  );
}