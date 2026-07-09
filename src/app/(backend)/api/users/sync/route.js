import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification, appendSharedActionNotification } from "@/dashboard/lib/dashboardNotifications";
import { getAuthenticatedUserFromStore, isSameUser, sanitizeUser } from "@/backend/lib/auth";
import { supabaseAdmin as supabase } from "@/backend/lib/supabase";
import { getAllUsers, saveUser } from "@/backend/lib/userStore";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

function normalizeComparableValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isCustomUploaded(url) {
  if (!url) {
    return false;
  }

  const lower = String(url).toLowerCase();
  return lower.startsWith("/uploads/") || lower.includes("blog-media/avatars/");
}

async function syncPostAuthors(previousUser, nextUser) {
  const previousName = String(previousUser?.name ?? "").trim();
  const previousEmail = String(previousUser?.email ?? "").trim();
  const nextName = String(nextUser?.name ?? "").trim();
  const nextEmail = String(nextUser?.email ?? "").trim();

  if (!nextName || !nextEmail) {
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
    console.error("[Sync API] Supabase update error:", supabaseErr);
  }
}

// Trigger hot-reload
export async function POST(request) {
  try {
    const { id, name, email, avatar, role, bio, password, expiresAt, status } = await request.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const emailVal = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailVal)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const users = await getAllUsers();
    const cookieStore = await cookies();
    const actor = await getAuthenticatedUserFromStore(cookieStore);

    if (!actor) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const actorIsAdmin = isAdminUser(actor);
    const existingIndex = users.findIndex(
      (user) =>
        (id && String(user.id) === String(id)) ||
        normalizeComparableValue(user.email) === emailVal
    );

    if (!id && existingIndex > -1) {
      return Response.json({ error: "A user with this email address is already registered." }, { status: 400 });
    }

    let targetUser = null;

    if (existingIndex > -1) {
      const existingUser = users[existingIndex];

      if (!actorIsAdmin && !isSameUser(actor, existingUser)) {
        return Response.json({ error: "Forbidden." }, { status: 403 });
      }

      if (existingUser.status === "inactive" && !actorIsAdmin) {
        return Response.json({ error: "Access denied. User is deactivated.", status: "deactivated" }, { status: 403 });
      }

      if (existingUser.expiresAt && !actorIsAdmin) {
        const expiry = new Date(existingUser.expiresAt);
        if (expiry < new Date()) {
          return Response.json({ error: "Admin revoked your access.", status: "expired" }, { status: 403 });
        }
      }

      const existingAvatar = existingUser.avatar || "";
      const incomingAvatar = avatar !== undefined ? (avatar || "") : existingAvatar;

      let resolvedAvatar = "";
      if (incomingAvatar === "") {
        resolvedAvatar = "";
      } else if (isCustomUploaded(incomingAvatar)) {
        resolvedAvatar = incomingAvatar;
      } else if (isCustomUploaded(existingAvatar)) {
        resolvedAvatar = existingAvatar;
      } else {
        resolvedAvatar = incomingAvatar || existingAvatar;
      }

      targetUser = {
        ...existingUser,
        id: id || existingUser.id,
        name: name || existingUser.name,
        email: actorIsAdmin ? (email || existingUser.email) : existingUser.email,
        avatar: resolvedAvatar,
        bio: bio !== undefined ? bio : (existingUser.bio || ""),
        password: password !== undefined ? password : (existingUser.password || ""),
        expiresAt: actorIsAdmin
          ? (expiresAt !== undefined ? expiresAt : (existingUser.expiresAt || null))
          : (existingUser.expiresAt || null),
        role: actorIsAdmin ? (role || existingUser.role) : existingUser.role,
        status: actorIsAdmin ? (status || existingUser.status) : existingUser.status,
      };

      await syncPostAuthors(existingUser, targetUser);
    } else {
      if (!actorIsAdmin) {
        return Response.json({ error: "Only admins can create new users." }, { status: 403 });
      }

      const resolvedAvatar = avatar && !avatar.includes("secure.gravatar.com/avatar/") && !avatar.includes("gravatar.com")
        ? avatar
        : "";

      targetUser = {
        id: id || `user-${Date.now()}`,
        name: name || email.split("@")[0],
        email,
        role: role || "editor",
        status: status || "active",
        avatar: resolvedAvatar,
        bio: bio || "",
        password: password || "",
        expiresAt: expiresAt || null,
        joinedAt: new Date().toISOString(),
      };

      try {
        const notification = createActionNotification({
          type: "user-add",
          title: `User added "${targetUser.name}"`,
          recipientRole: "admin",
        });
        await appendActionNotificationCookie(cookieStore, notification);
        await appendSharedActionNotification(notification);
      } catch (cookieErr) {
        console.warn("[Sync API] Could not set user notification cookie:", cookieErr.message);
      }
    }

    await saveUser(targetUser);

    return Response.json({ success: true, user: sanitizeUser(targetUser) });
  } catch (err) {
    console.error("[Sync API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}