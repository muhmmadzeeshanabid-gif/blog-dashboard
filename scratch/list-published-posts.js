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

async function list() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, publishedAt, isSticky")
    .eq("status", "published")
    .order("publishedAt", { ascending: false });

  if (error) {
    console.error(error);
  } else {
    console.log("Published Posts (ordered by publishedAt desc):");
    data.forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.id}] "${p.title}" | Pinned: ${p.isSticky} | Published: ${p.publishedAt}`);
    });
  }
}

list();
