import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore, sanitizeUser } from "@/backend/lib/auth";
import { getAllUsers, saveUser } from "@/backend/lib/userStore";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

function normalizeComparableValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);

  if (!currentUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return Response.json({ user: sanitizeUser(currentUser) });
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const currentUser = await getAuthenticatedUserFromStore(cookieStore);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const users = await getAllUsers();
    const index = users.findIndex((user) => String(user.id) === String(currentUser.id));

    if (index === -1) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const nextUser = { ...users[index] };

    if (payload.name !== undefined) {
      const nextName = String(payload.name).trim();
      if (!nextName) {
        return Response.json({ error: "Display name cannot be empty." }, { status: 400 });
      }
      nextUser.name = nextName;
    }

    if (payload.avatar !== undefined) {
      nextUser.avatar = payload.avatar || "";
    }

    if (payload.bio !== undefined) {
      nextUser.bio = String(payload.bio ?? "");
    }

    if (payload.email !== undefined) {
      const nextEmail = String(payload.email).trim().toLowerCase();

      if (!isAdminUser(currentUser) && nextEmail !== normalizeComparableValue(nextUser.email)) {
        return Response.json({ error: "Only admins can change email addresses." }, { status: 403 });
      }

      if (!EMAIL_REGEX.test(nextEmail)) {
        return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const duplicateUser = users.find(
        (user) =>
          String(user.id) !== String(nextUser.id) &&
          normalizeComparableValue(user.email) === nextEmail
      );

      if (duplicateUser) {
        return Response.json({ error: "A user with this email address already exists." }, { status: 400 });
      }

      nextUser.email = nextEmail;
    }

    await saveUser(nextUser);

    return Response.json({ success: true, user: sanitizeUser(nextUser) });
  } catch (error) {
    console.error("[Users Session API] PATCH failed:", error);
    return Response.json({ error: error.message || "Failed to update session user." }, { status: 500 });
  }
}