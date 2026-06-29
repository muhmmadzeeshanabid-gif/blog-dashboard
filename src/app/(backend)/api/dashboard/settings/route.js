import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAppSettings, updateAppSettings } from "@/backend/lib/appSettings";

export const runtime = "nodejs";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("orin_user_session")?.value;

  if (!sessionValue) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(sessionValue));
  } catch {
    return null;
  }
}

export async function GET() {
  const settings = await getAppSettings();
  return Response.json({ settings });
}

export async function PUT(request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return Response.json({ error: "Only admins can update content settings." }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const currentSettings = await getAppSettings();
    const { settings, source } = await updateAppSettings({
      ...currentSettings,
      ...payload
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
