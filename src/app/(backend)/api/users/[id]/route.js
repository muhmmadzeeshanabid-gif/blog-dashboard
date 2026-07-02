import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification, appendSharedActionNotification } from "@/dashboard/lib/dashboardNotifications";
import { clearUserSessions } from "@/backend/lib/sessionStore";
import { getAuthenticatedUserFromStore, isSameUser, sanitizeUser } from "@/backend/lib/auth";
import { supabaseAdmin as supabase } from "@/backend/lib/supabase";
import { getAllUsers, saveUser, deleteUser } from "@/backend/lib/userStore";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

function normalizeComparableValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function syncPostAuthors(previousUser, nextUser) {
  const previousName = String(previousUser?.name ?? "").trim();
  const previousEmail = String(previousUser?.email ?? "").trim();
  const nextName = String(nextUser?.name ?? "").trim();
  const nextEmail = String(nextUser?.email ?? "").trim();

  if (!nextName || !nextEmail || (!previousName && !previousEmail)) {
    return;
  }

  const nextAuthor = `${nextName} <${nextEmail}>`;

  try {
    if (previousName && previousName !== nextName) {
      await supabase
        .from("posts")
        .update({ author: nextAuthor })
        .eq("author", previousName);
    }

    if (previousEmail) {
      await supabase
        .from("posts")
        .update({ author: nextAuthor })
        .ilike("author", `%<${previousEmail}>%`);
    }
  } catch (supabaseErr) {
    console.error("[Users API] Supabase author sync error:", supabaseErr);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const actor = await getAuthenticatedUserFromStore(cookieStore);

    if (!actor) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { role, status, name, email, avatar, password, expiresAt, bio } = body;

    const users = await getAllUsers();
    const index = users.findIndex((user) => String(user.id) === String(id));

    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = users[index];
    const actorIsAdmin = isAdminUser(actor);

    if (!actorIsAdmin && !isSameUser(actor, existingUser)) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!actorIsAdmin && (role !== undefined || status !== undefined || expiresAt !== undefined)) {
      return Response.json({ error: "You cannot change role, status, or access expiry." }, { status: 403 });
    }

    if (!actorIsAdmin && email !== undefined && normalizeComparableValue(email) !== normalizeComparableValue(existingUser.email)) {
      return Response.json({ error: "Only admins can change email addresses." }, { status: 403 });
    }

    const nextUser = { ...existingUser };

    if (role !== undefined) {
      nextUser.role = role;
    }

    if (status !== undefined) {
      nextUser.status = status;
    }

    if (name !== undefined) {
      const nextName = String(name).trim();
      if (!nextName) {
        return Response.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      nextUser.name = nextName;
    }

    if (email !== undefined) {
      const nextEmail = String(email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(nextEmail)) {
        return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const duplicateUser = users.find(
        (user) =>
          String(user.id) !== String(existingUser.id) &&
          normalizeComparableValue(user.email) === nextEmail
      );

      if (duplicateUser) {
        return Response.json({ error: "A user with this email address already exists." }, { status: 400 });
      }

      nextUser.email = nextEmail;
    }

    if (avatar !== undefined) {
      nextUser.avatar = avatar || "";
    }

    if (bio !== undefined) {
      nextUser.bio = String(bio ?? "");
    }

    if (expiresAt !== undefined) {
      nextUser.expiresAt = expiresAt || null;
    }

    if (password !== undefined) {
      const nextPassword = String(password).trim();
      if (!nextPassword) {
        return Response.json({ error: "Password cannot be empty." }, { status: 400 });
      }

      nextUser.password = nextPassword;

      try {
        const notification = createActionNotification({
          type: "password-change",
          title: `User "${nextUser.name}" changed their password`,
          recipientEmail: nextUser.email,
        });
        await appendActionNotificationCookie(cookieStore, notification);
        await appendSharedActionNotification(notification);
      } catch (cookieErr) {
        console.warn("[Users PUT API] Could not set notification cookie:", cookieErr.message);
      }
    }

    await syncPostAuthors(existingUser, nextUser);
    await saveUser(nextUser);

    return Response.json({ success: true, user: sanitizeUser(nextUser) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const actor = await getAuthenticatedUserFromStore(cookieStore);

    if (!actor) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!isAdminUser(actor)) {
      return Response.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    if (String(actor.id) === String(id)) {
      return Response.json({ error: "You cannot delete your own active account." }, { status: 400 });
    }

    const users = await getAllUsers();
    const index = users.findIndex((user) => String(user.id) === String(id));
    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const deletedUser = users[index];

    await clearUserSessions(id);
    await deleteUser(id);

    try {
      const notification = createActionNotification({
        type: "user-delete",
        title: `User deleted "${deletedUser.name || deletedUser.email.split("@")[0]}"`,
        recipientRole: "admin",
      });
      await appendActionNotificationCookie(cookieStore, notification);
      await appendSharedActionNotification(notification);
    } catch (cookieErr) {
      console.warn("[Users DELETE API] Could not set user notification cookie:", cookieErr.message);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}