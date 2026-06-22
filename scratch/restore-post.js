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

const postToRestore = {
  id: "post-01",
  slug: "how-minimalism-helps-me-stay-calm",
  title: "How Minimalism Helps Me Stay Calm",
  category: "Minimalism",
  format: "image",
  status: "published",
  author: "Admin",
  excerpt: "In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et.",
  content: "Minimalism gives me room to breathe, focus, and notice what really matters.\n\nWhen the space around me is calmer, my mind also settles down and daily work feels more intentional.\n\nA smaller list of priorities helps me finish what matters instead of carrying noise all day.",
  image: "/images/bench-accounting-h51-unsplash.jpg",
  galleryImages: [],
  gallery: [],
  videoUrl: "",
  audioUrl: "",
  tags: ["minimalism", "focus", "mindset"],
  comments: 6,
  totalViews: 4798,
  viewsByDate: {
    "2026-06-10": 1192,
    "2026-06-11": 1602,
    "2026-06-12": 2003,
    "2026-06-15": 1
  },
  isSticky: true,
  isFeatured: true,
  createdAt: "2026-04-28T04:15:00.000Z",
  updatedAt: new Date().toISOString(),
  publishedAt: "2026-06-10T05:00:00.000Z"
};

async function restore() {
  console.log("Inserting post into Supabase...");
  const { data, error } = await supabase
    .from("posts")
    .insert([postToRestore])
    .select();

  if (error) {
    console.error("Error inserting post, retrying without SEO columns if applicable:", error);
    // Retry without potentially non-existent SEO columns
    const { seoTitle, seoDescription, ogImage, ...cleanPost } = postToRestore;
    const retry = await supabase
      .from("posts")
      .insert([cleanPost])
      .select();
      
    if (retry.error) {
      console.error("Retry failed:", retry.error);
    } else {
      console.log("Successfully restored post on retry:", retry.data);
    }
  } else {
    console.log("Successfully restored post:", data);
  }
}

restore();
