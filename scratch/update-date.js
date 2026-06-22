import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateDate() {
  console.log("Updating post-01 publishedAt date in Supabase...");
  const { data, error } = await supabase
    .from("posts")
    .update({ 
      publishedAt: "2026-06-19T12:00:00.000Z",
      updatedAt: new Date().toISOString()
    })
    .eq("id", "post-01")
    .select();

  if (error) {
    console.error("Error updating date:", error);
  } else {
    console.log("Successfully updated post-01:", data);
  }
}

updateDate();
