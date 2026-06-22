import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification, appendSharedActionNotification } from "../../../../lib/dashboardNotifications";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";
import { getAllUsers, saveUser, deleteUser } from "../../../../lib/userStore";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, name, email, avatar, password, expiresAt } = body;

    const users = await getAllUsers();
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
    if (email) {
      const emailVal = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      const isAdminOrin = emailVal === "admin@orin.com";
      if (!emailRegex.test(emailVal) && !isAdminOrin) {
        return Response.json({ error: "Please enter a valid Gmail address (ending in @gmail.com)." }, { status: 400 });
      }
      users[index].email = email;
    }
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

    // Save updated user to user store (Supabase + fallback)
    await saveUser(users[index]);

    return Response.json({ success: true, user: users[index] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const users = await getAllUsers();
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const deletedUser = users[index];
    
    // Delete from user store (Supabase + fallback)
    await deleteUser(id);

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
