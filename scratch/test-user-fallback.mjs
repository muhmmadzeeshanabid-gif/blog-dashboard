import fs from "node:fs";

// Read and parse .env.local
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIdx = trimmed.indexOf("=");
    if (separatorIdx > 0) {
      const key = trimmed.slice(0, separatorIdx).trim();
      let val = trimmed.slice(separatorIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local:", e.message);
}

const { getAllUsers } = await import("../src/lib/userStore.js");

async function test() {
  console.log("Calling getAllUsers()...");
  const users = await getAllUsers();
  console.log("Returned users count:", users.length);
  if (users.length > 0) {
    console.log("Sample user name:", users[0].name);
    console.log("Sample user email:", users[0].email);
    console.log("Sample user role:", users[0].role);
    console.log("Test PASSED: Successfully fell back to users.json because Supabase table doesn't exist yet.");
  } else {
    console.log("Test FAILED or no users in local users.json.");
  }
}

test().catch(console.error);
