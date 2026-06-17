import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");

let supabaseUrl = "";
let serviceRoleKey = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = trimmed.split("=")[1].trim();
  if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) serviceRoleKey = trimmed.split("=")[1].trim();
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log("Checking blog-media bucket CORS settings...");

  // Try updating the bucket to be public with proper settings
  const { data: updateData, error: updateError } = await supabase.storage.updateBucket("blog-media", {
    public: true,
    allowedMimeTypes: ["image/*", "video/*", "audio/*"],
    fileSizeLimit: 104857600, // 100MB max
  });

  if (updateError) {
    console.error("Failed to update bucket:", updateError);
  } else {
    console.log("✅ Bucket updated successfully:", updateData);
  }

  // Test that anon key can upload directly
  console.log("\nTesting direct browser-style upload with anon key...");
  const testContent = Buffer.from("test-file-content");
  const testFileName = `cors-test-${Date.now()}.txt`;

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/blog-media/${testFileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY_TEST || "sb_publishable_zM4G3PZsz439qdU_NfG5XQ_0NTxBBFO"}`,
      "Content-Type": "text/plain",
      "x-upsert": "false",
    },
    body: testContent,
  });

  console.log("Upload response status:", uploadResponse.status);
  const responseText = await uploadResponse.text();
  console.log("Upload response:", responseText);

  if (uploadResponse.ok) {
    console.log("✅ Direct browser upload works with anon key!");
    // Cleanup
    await supabase.storage.from("blog-media").remove([testFileName]);
    console.log("✅ Test file cleaned up");
  } else {
    console.error("❌ Direct upload FAILED. We need to add an RLS policy for storage.");
    console.log("\nTo fix this, run this SQL in your Supabase SQL Editor:");
    console.log(`
-- Allow anyone to upload files (public bucket)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'blog-media');

-- Allow anyone to read files
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-media');

-- Allow anyone to delete files (optional, for cleanup)
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'blog-media');
    `);
  }
}

run();
