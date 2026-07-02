import { redirect } from "next/navigation";

/**
 * Dashboard 404 handler.
 * When /dashboard/anything-invalid is visited,
 * the URL updates to /404 and the ORIN 404 page is shown.
 */
export default function DashboardNotFound() {
  redirect("/404");
}
