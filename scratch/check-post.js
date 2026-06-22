import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
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
} catch (e) {
  console.error("Error loading .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log("Supabase is not configured.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title")
    .eq("slug", "how-minimalism-helps-me-stay-calm");

  if (error) {
    console.error("Error querying posts:", error);
  } else {
    console.log("Matched posts:", data);
  }
}

check();
