import { promises as fs } from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function POST(request) {
  try {
    const { id, name, email, avatar, role } = await request.json();
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

    const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    const userData = {
      id: id || `user-${Date.now()}`,
      name: name || email.split("@")[0],
      email: email,
      role: role || "writer",
      status: "active",
      avatar: avatar || "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=100&d=mp&r=g",
      joinedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      // Keep existing role, status, joinedAt, but update name/avatar if they changed
      users[existingIndex] = {
        ...users[existingIndex],
        name: name || users[existingIndex].name,
        avatar: avatar || users[existingIndex].avatar,
      };
    } else {
      users.push(userData);
    }

    // Ensure the data directory exists
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");

    return Response.json({ success: true, user: users[existingIndex > -1 ? existingIndex : users.length - 1] });
  } catch (err) {
    console.error("[Sync API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
