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

export async function GET() {
  const users = await readUsers();
  return Response.json(users);
}
