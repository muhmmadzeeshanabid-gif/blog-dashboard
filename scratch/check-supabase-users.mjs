import fs from "node:fs";

// 1. Read and parse .env.local first
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

const { supabaseAdmin: supabase } = await import("../src/lib/supabase.js");

async function check() {
  console.log("Checking if 'users' table exists in Supabase...");
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error querying 'users' table:", error.message || error);
    if (error.message && error.message.includes("relation \"users\" does not exist")) {
      console.log("Verdict: 'users' table does NOT exist in Supabase.");
    }
  } else {
    console.log("Success! 'users' table exists in Supabase. Row count sample:", data.length);
  }
}

check().catch(console.error);
