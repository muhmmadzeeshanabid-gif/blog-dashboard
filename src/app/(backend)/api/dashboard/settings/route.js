import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { getAppSettings, updateAppSettings } from "@/backend/lib/appSettings";

export const runtime = "nodejs";

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

export async function GET() {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);

  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const settings = await getAppSettings();
  return Response.json({ settings });
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);

  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isAdminUser(currentUser)) {
    return Response.json({ error: "Only admins can update content settings." }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const currentSettings = await getAppSettings();
    const { settings, source } = await updateAppSettings({
      ...currentSettings,
      ...payload,
    });

    revalidatePath("/", "layout");

    return Response.json({
      message: "Content settings saved successfully.",
      settings,
      source,
    });
  } catch (error) {
    console.error("[PUT /api/dashboard/settings] Unhandled error:", error?.message || error);
    return Response.json({ error: "Unable to save content settings." }, { status: 500 });
  }
}