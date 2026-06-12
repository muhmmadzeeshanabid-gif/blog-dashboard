import { getDashboardOverview } from "../../../../lib/dashboardData";

export async function GET(request) {
  const url = new URL(request.url);
  const overview = await getDashboardOverview({
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  return Response.json(overview);
}
