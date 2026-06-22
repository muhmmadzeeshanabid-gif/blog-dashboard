import { promises as fs } from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    let users = [];
    try {
      const fileData = await fs.readFile(usersFilePath, "utf8");
      users = JSON.parse(fileData);
    } catch (err) {
      return Response.json({ error: "Users database is empty or not found" }, { status: 400 });
    }

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!matchedUser) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check status
    if (matchedUser.status === "inactive") {
      return Response.json({ error: "Your account has been deactivated. Please contact the administrator." }, { status: 403 });
    }

    // Check expiry
    if (matchedUser.expiresAt) {
      const expiry = new Date(matchedUser.expiresAt);
      if (expiry < new Date()) {
        return Response.json({ error: "Admin revoked your access." }, { status: 403 });
      }
    }

    // Check password
    const storedPassword = String(matchedUser.password || "").trim();
    const enteredPassword = String(password).trim();

    if (storedPassword !== enteredPassword) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Return user details on successful match (excluding password)
    const { password: _, ...userWithoutPassword } = matchedUser;

    return Response.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error("[Login API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
