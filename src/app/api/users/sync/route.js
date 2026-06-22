import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification, appendSharedActionNotification } from "../../../../lib/dashboardNotifications";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function POST(request) {
  try {
    const { id, name, email, avatar, role, bio, password, expiresAt } = await request.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    let users = [];
    try {
      const fileData = await fs.readFile(usersFilePath, "utf8");
      if (fileData.trim()) {
        users = JSON.parse(fileData);
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("[Sync API] Error reading/parsing users.json:", err);
        return Response.json({ error: "Failed to read database." }, { status: 500 });
      }
      users = [];
    }

    // Read the current logged-in user from the session cookie
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get("orin_user_session")?.value;
    let actor = null;
    if (sessionValue) {
      try {
        actor = JSON.parse(decodeURIComponent(sessionValue));
      } catch (e) {
        // ignore
      }
    }

    // Check if the actor is an admin in our users.json database
    const actorInDb = actor ? users.find(u => (actor.id && u.id === actor.id) || u.email.toLowerCase() === actor.email?.toLowerCase()) : null;
    const actorIsAdmin = actorInDb?.role === "admin" || (actor && (actor.email?.toLowerCase().includes("admin") || actor.email?.toLowerCase() === "admin@orin.com"));

    const existingIndex = users.findIndex(u => (id && u.id === id) || u.email.toLowerCase() === email.toLowerCase());
    const targetIsAdmin = (role === "admin" || email.toLowerCase().includes("admin") || email.toLowerCase() === "admin@orin.com");

    const emailHash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
    const realGravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=200&d=404`;

    // Only reject unregistered users if neither the target user nor the acting user is an admin
    if (existingIndex === -1 && !targetIsAdmin && !actorIsAdmin) {
      return Response.json({ error: "Access denied. User is not registered.", status: "denied" }, { status: 403 });
    }

    if (existingIndex > -1) {
      if (users[existingIndex].status === "inactive" && !targetIsAdmin) {
        return Response.json({ error: "Access denied. User is deactivated.", status: "deactivated" }, { status: 403 });
      }

      if (users[existingIndex].expiresAt && !targetIsAdmin) {
        const expiry = new Date(users[existingIndex].expiresAt);
        if (expiry < new Date()) {
          return Response.json({ error: "Admin revoked your access.", status: "expired" }, { status: 403 });
        }
      }

      // Decide which avatar to use. We prefer custom uploaded avatars or custom URLs.
      const existingAvatar = users[existingIndex].avatar || "";
      const incomingAvatar = avatar || "";

      const isExistingCustom = existingAvatar && !existingAvatar.includes("00000000000000000000000000000000") && !existingAvatar.includes("gravatar.com");
      const isIncomingCustom = incomingAvatar && !incomingAvatar.includes("00000000000000000000000000000000") && !incomingAvatar.includes("gravatar.com");

      let resolvedAvatar = "";
      if (isIncomingCustom) {
        // If the incoming avatar is a custom upload/URL, use it (meaning the user just updated it)
        resolvedAvatar = incomingAvatar;
      } else if (isExistingCustom) {
        // If the existing avatar is custom, but incoming is a placeholder/default, preserve the custom one!
        resolvedAvatar = existingAvatar;
      } else {
        // If neither is custom, use the incoming if it's a valid custom URL, otherwise default to empty (initials)
        resolvedAvatar = (incomingAvatar && !incomingAvatar.includes("00000000000000000000000000000000") && !incomingAvatar.includes("gravatar.com") ? incomingAvatar : "");
      }

      // Keep existing role, status, joinedAt, but update ID, name, email, avatar, bio, and password (if provided)
      const oldName = users[existingIndex].name;
      const newName = name || oldName;
      try {
        if (oldName && oldName !== newName) {
          // 1. Update legacy posts (matching oldName exactly) to the new email format
          await supabase
            .from("posts")
            .update({ author: `${newName} <${email}>` })
            .eq("author", oldName);
        }
        // 2. Update existing email-format posts
        await supabase
          .from("posts")
          .update({ author: `${newName} <${email}>` })
          .ilike("author", `%<${email}>%`);
      } catch (supabaseErr) {
        console.error("[Sync API] Supabase update error:", supabaseErr);
      }

      users[existingIndex] = {
        ...users[existingIndex],
        id: id || users[existingIndex].id,
        name: name || users[existingIndex].name,
        email: email || users[existingIndex].email,
        avatar: resolvedAvatar,
        bio: bio !== undefined ? bio : (users[existingIndex].bio || ""),
        password: password !== undefined ? password : (users[existingIndex].password || ""),
        expiresAt: expiresAt !== undefined ? expiresAt : (users[existingIndex].expiresAt || null),
      };
    } else {
      const resolvedAvatar = (avatar && !avatar.includes("secure.gravatar.com/avatar/") && !avatar.includes("gravatar.com") ? avatar : "");
      const userData = {
        id: id || `user-${Date.now()}`,
        name: name || email.split("@")[0],
        email: email,
        role: role || "editor",
        status: "active",
        avatar: resolvedAvatar,
        bio: bio || "",
        password: password || "",
        expiresAt: expiresAt || null,
        joinedAt: new Date().toISOString()
      };
      users.push(userData);
      
      try {
        const cookieStore = await cookies();
        const notification = createActionNotification({
          type: "user-add",
          title: `User added "${userData.name}"`,
          recipientRole: "admin"
        });
        await appendActionNotificationCookie(cookieStore, notification);
        await appendSharedActionNotification(notification);
      } catch (cookieErr) {
        console.warn("[Sync API] Could not set user notification cookie:", cookieErr.message);
      }
    }

    // Ensure the data directory exists
    try {
      await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
      const tmpPath = usersFilePath + ".tmp";
      await fs.writeFile(tmpPath, JSON.stringify(users, null, 2), "utf8");
      await fs.rename(tmpPath, usersFilePath);
    } catch (writeErr) {
      console.warn("[Sync API] Could not write users.json (filesystem may be read-only):", writeErr.message);
    }

    return Response.json({ success: true, user: users[existingIndex > -1 ? existingIndex : users.length - 1] });
  } catch (err) {
    console.error("[Sync API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
