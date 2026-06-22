import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://placeholder.supabase.co";
const supabaseAnonKey = "placeholder";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*");
    console.log("Data:", data);
    console.log("Error:", error);
    console.log("JSON Error:", JSON.stringify(error));
  } catch (e) {
    console.error("Exception:", e);
  }
}

run();
