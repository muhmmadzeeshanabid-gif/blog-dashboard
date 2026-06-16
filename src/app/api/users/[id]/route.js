import { promises as fs } from "fs";
import path from "path";

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

    users = users.filter(u => u.id !== id);
    await writeUsers(users);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
