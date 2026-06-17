import { cookies } from "next/headers";
import { getDashboardMedia } from "../../../lib/dashboardData";
import { getDashboardNavItems } from "../navigation";
import MediaClient from "./MediaClient";

export const metadata = {
  title: "Media | ORIN Dashboard",
  description: "Browse uploads, gallery assets, and media storage inside the ORIN dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardMediaPage() {
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

  const mediaData = await getDashboardMedia({}, new Date(), currentUser);

  return (
    <MediaClient
      initialMedia={mediaData}
      navItems={getDashboardNavItems("/dashboard/media")}
      isDarkInitial={isDarkInitial}
    />
  );
}
