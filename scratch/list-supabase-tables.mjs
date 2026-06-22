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

const { supabaseAdmin: supabase } = await import("../src/lib/supabase.js");

async function check() {
  console.log("Listing tables from Supabase database...");
  // Let's run a simple query using rpc or direct sql, or just select from supabase built-ins if possible,
  // or retrieve list of tables using pg_tables through a simple select if supabase has it exposed or allows it.
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Error querying posts:", error);
  } else {
    console.log("Posts table is accessible.");
  }

  // Let's check app_settings
  const { data: settingsData, error: settingsError } = await supabase
    .from("app_settings")
    .select("*")
    .limit(1);

  if (settingsError) {
    console.error("Error querying app_settings:", settingsError.message);
  } else {
    console.log("app_settings table is accessible. Content:", settingsData);
  }
  
  // Let's check if there are other tables like "users_db", "dashboard_users", "orin_users", etc.
  const checkTables = ["users", "blog_users", "profiles", "members", "admin_users", "site_users"];
  for (const table of checkTables) {
    const { error: tblErr } = await supabase.from(table).select("*").limit(1);
    if (!tblErr) {
      console.log(`Table '${table}' exists and is accessible!`);
    } else {
      console.log(`Table '${table}' query error:`, tblErr.message);
    }
  }
}

check().catch(console.error);
