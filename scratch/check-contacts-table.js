const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  const envPath = path.join(__dirname, "../.env.local");
  let supabaseUrl = "";
  let supabaseServiceRoleKey = "";

  try {
    const envContent = await fs.readFile(envPath, "utf8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("#") || !line.includes("=")) continue;
      const [key, ...valueParts] = line.split("=");
      const val = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key.trim() === "NEXT_PUBLIC_SUPABASE_URL") {
        supabaseUrl = val;
      }
      if (key.trim() === "SUPABASE_SERVICE_ROLE_KEY") {
        supabaseServiceRoleKey = val;
      }
    }
  } catch (err) {
    console.error("Failed to read env:", err.message);
  }

  if (supabaseUrl && supabaseServiceRoleKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Check if contacts table exists by attempting to select from it
    const { data, error } = await supabase.from("contacts").select("*").limit(1);
    if (error) {
      console.log("contacts table does not exist or error:", error.message);
    } else {
      console.log("contacts table exists, columns:", Object.keys(data[0] || {}));
    }
  } else {
    console.log("Supabase URL or Key not found in env.");
  }
}

main().catch(console.error);
