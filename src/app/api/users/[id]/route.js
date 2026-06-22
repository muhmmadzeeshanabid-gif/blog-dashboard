import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification, appendSharedActionNotification } from "../../../../lib/dashboardNotifications";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

async function readUsers() {
  try {
    const fileData = await fs.readFile(usersFilePath, "utf8");
    if (!fileData.trim()) return [];
    return JSON.parse(fileData);
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function writeUsers(users) {
  try {
    const tmpPath = usersFilePath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(users, null, 2), "utf8");
    await fs.rename(tmpPath, usersFilePath);
  } catch (err) {
    console.warn("[Users API] Could not write users.json (filesystem may be read-only):", err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, name, email, avatar, password, expiresAt } = body;

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (role) users[index].role = role;
    if (status) users[index].status = status;
    if (name) {
      const oldName = users[index].name;
      const newName = name;
      const userEmail = email || users[index].email;
      if (newName && oldName && oldName !== newName) {
        try {
          // 1. Update legacy posts
          await supabase
            .from("posts")
            .update({ author: `${newName} <${userEmail}>` })
            .eq("author", oldName);
          // 2. Update existing email-format posts
          await supabase
            .from("posts")
            .update({ author: `${newName} <${userEmail}>` })
            .ilike("author", `%<${userEmail}>%`);
        } catch (supabaseErr) {
          console.error("[Users API PUT] Supabase update error:", supabaseErr);
        }
      }
      users[index].name = name;
    }
    if (email) users[index].email = email;
    if (avatar) users[index].avatar = avatar;
    if (expiresAt !== undefined) users[index].expiresAt = expiresAt || null;
    if (password !== undefined) {
      users[index].password = password;
      try {
        const cookieStore = await cookies();
        const notification = createActionNotification({
          type: "password-change",
          title: `User "${users[index].name}" changed their password`,
          recipientEmail: users[index].email
        });
        await appendActionNotificationCookie(cookieStore, notification);
        await appendSharedActionNotification(notification);
      } catch (cookieErr) {
        console.warn("[Users PUT API] Could not set notification cookie:", cookieErr.message);
      }
    }



    await writeUsers(users);

    return Response.json({ success: true, user: users[index] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    let users = await readUsers();
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const deletedUser = users[index];
    users = users.filter(u => u.id !== id);
    await writeUsers(users);

    try {
      const cookieStore = await cookies();
      const notification = createActionNotification({
        type: "user-delete",
        title: `User deleted "${deletedUser.name || deletedUser.email.split("@")[0]}"`,
        recipientRole: "admin"
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
