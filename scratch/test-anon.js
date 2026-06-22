import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");

let supabaseUrl = "";
let anonKey = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = trimmed.split("=")[1].trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) anonKey = trimmed.split("=")[1].trim();
}

console.log("Supabase URL:", supabaseUrl);
console.log("Anon Key:", anonKey);

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  const { data, error } = await supabase.from("posts").select("*");
  if (error) {
    console.error("Error details:", error);
    console.error("JSON stringified error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Data fetched:", data.length, "posts");
  }
}

run();
