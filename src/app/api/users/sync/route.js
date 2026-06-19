import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification } from "../../../../lib/dashboardNotifications";
import crypto from "crypto";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function POST(request) {
  try {
    const { id, name, email, avatar, role, bio } = await request.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    let users = [];
    try {
      const fileData = await fs.readFile(usersFilePath, "utf8");
      users = JSON.parse(fileData);
    } catch (err) {
      // file might not exist or be empty
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
    const actorInDb = actor ? users.find(u => u.email.toLowerCase() === actor.email?.toLowerCase()) : null;
    const actorIsAdmin = actorInDb?.role === "admin" || (actor && (actor.email?.toLowerCase().includes("admin") || actor.email?.toLowerCase() === "admin@orin.com"));

    const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
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
        // If neither is custom, use the incoming if it's a valid custom URL, otherwise default to real Gravatar
        resolvedAvatar = (incomingAvatar && !incomingAvatar.includes("00000000000000000000000000000000") && !incomingAvatar.includes("gravatar.com") ? incomingAvatar : realGravatarUrl);
      }

      // Keep existing role, status, joinedAt, but update ID, name, avatar, bio if they changed
      users[existingIndex] = {
        ...users[existingIndex],
        id: id || users[existingIndex].id,
        name: name || users[existingIndex].name,
        avatar: resolvedAvatar,
        bio: bio !== undefined ? bio : (users[existingIndex].bio || ""),
      };
    } else {
      const resolvedAvatar = (avatar && !avatar.includes("secure.gravatar.com/avatar/") ? avatar : realGravatarUrl);
      const userData = {
        id: id || `user-${Date.now()}`,
        name: name || email.split("@")[0],
        email: email,
        role: role || "writer",
        status: "active",
        avatar: resolvedAvatar,
        bio: bio || "",
        joinedAt: new Date().toISOString()
      };
      users.push(userData);
      
      try {
        const cookieStore = await cookies();
        const notification = createActionNotification({
          type: "user-add",
          title: `User added "${userData.name}"`,
        });
        await appendActionNotificationCookie(cookieStore, notification);
      } catch (cookieErr) {
        console.warn("[Sync API] Could not set user notification cookie:", cookieErr.message);
      }
    }

    // Ensure the data directory exists
    try {
      await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
      await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
    } catch (writeErr) {
      console.warn("[Sync API] Could not write users.json (filesystem may be read-only):", writeErr.message);
    }

    return Response.json({ success: true, user: users[existingIndex > -1 ? existingIndex : users.length - 1] });
  } catch (err) {
    console.error("[Sync API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
