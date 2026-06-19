import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { appendActionNotificationCookie, createActionNotification } from "../../../../lib/dashboardNotifications";
import crypto from "crypto";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

async function readUsers() {
  try {
    const fileData = await fs.readFile(usersFilePath, "utf8");
    return JSON.parse(fileData);
  } catch (err) {
    return [];
  }
}

async function writeUsers(users) {
  try {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.warn("[Users API] Could not write users.json (filesystem may be read-only):", err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, name, email, avatar } = body;

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (role) users[index].role = role;
    if (status) users[index].status = status;
    if (name) users[index].name = name;
    if (email) users[index].email = email;
    if (avatar) users[index].avatar = avatar;

    // Resolve real Gravatar URL if the avatar is empty/placeholder or a Gravatar URL
    const currentEmail = users[index].email;
    const currentAvatar = users[index].avatar || "";
    if (
      currentEmail &&
      (!currentAvatar ||
       currentAvatar.includes("00000000000000000000000000000000") ||
       currentAvatar.includes("gravatar.com"))
    ) {
      const emailHash = crypto.createHash("md5").update(currentEmail.toLowerCase().trim()).digest("hex");
      users[index].avatar = `https://www.gravatar.com/avatar/${emailHash}?s=200&d=404`;
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
      });
      await appendActionNotificationCookie(cookieStore, notification);
    } catch (cookieErr) {
      console.warn("[Users DELETE API] Could not set user notification cookie:", cookieErr.message);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
