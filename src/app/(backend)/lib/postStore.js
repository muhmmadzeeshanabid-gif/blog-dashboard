import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";
import { getAppSettings } from "@/backend/lib/appSettings";
import { readSeededRuntimeJsonSync } from "@/backend/lib/runtimeState";
import { toTitleCase, pad, getDateKey, slugify } from "@/lib/utils";

let useLocalFallback = !isSupabaseConfigured;
let fallbackPostsCache = null;
let isSeededChecked = false;

function getLocalFallbackPosts() {
  if (!fallbackPostsCache) {
    fallbackPostsCache = createSeedPosts(new Date()).map(parsePost);
  }
  return fallbackPostsCache;
}

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "posts");
const MANAGED_UPLOAD_PREFIX = "/uploads/posts/";
const PLACEHOLDER_IMAGE = "/images/05-bench-accounting-h51-unsplash.jpg";
const SEEDED_PUBLISHED_PAGE_SIZE = 8;

const SEED_POSTS = [
  {
    id: "post-01",
    slug: "how-minimalism-helps-me-stay-calm",
    title: "How Minimalism Helps Me Stay Calm",
    category: "Minimalism",
    format: "image",
    status: "published",
    image: "/images/bench-accounting-h51-unsplash.jpg",
    excerpt:
      "In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et.",
    content:
      "Minimalism gives me room to breathe, focus, and notice what really matters.\n\nWhen the space around me is calmer, my mind also settles down and daily work feels more intentional.\n\nA smaller list of priorities helps me finish what matters instead of carrying noise all day.",
    author: "Alexey Trofimov",
    comments: 6,
    totalViews: 4795,
    createdDaysAgo: 45,
    publishedDaysAgo: 2,
    updatedDaysAgo: 0,
    isSticky: true,
    isFeatured: false,
    tags: ["minimalism", "focus", "mindset"],
  },
  {
    id: "post-02",
    slug: "what-will-help-you-be-happy",
    title: "What Will Help You Be Happy?",
    category: "Lifestyle",
    format: "gallery",
    status: "published",
    image: "/images/jan-pictures-cIDdZYoSeJ4-unsplash.jpg",
    galleryImages: [
      "/images/jan-pictures-cIDdZYoSeJ4-unsplash.jpg",
      "/images/aiony-haust-760593-unsplash.jpg",
      "/images/florencia-potter-QCRdeq27OEU-unsplash.jpg",
    ],
    excerpt:
      "Nunc egestas, augue at pellentesque laoreet, felis eros vehicula leo, at malesuada velit leo quis pede. Donec interdum, metus et hendrerit aliquet, dolor diam.",
    content:
      "Happiness rarely appears as one big event. Most of the time it grows from meaningful routines, good people, and small pauses.\n\nLearning what drains your energy is just as important as learning what restores it.\n\nThe happiest seasons usually come when life feels aligned, not crowded.",
    author: "Alexey Trofimov",
    comments: 5,
    totalViews: 1786,
    createdDaysAgo: 68,
    publishedDaysAgo: 4,
    updatedDaysAgo: 1,
    isFeatured: false,
    tags: ["lifestyle", "happiness"],
  },
  {
    id: "post-03",
    slug: "simple-ways-to-stay-focused",
    title: "Simple Ways To Stay Focused",
    category: "Productivity",
    format: "image",
    status: "published",
    image: "/images/evie-s-v220-unsplash.jpg",
    excerpt:
      "Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor.",
    content:
      "Focus becomes easier when your environment supports the task in front of you.\n\nA short reset before starting, fewer open tabs, and a clear finish line can change the whole day.\n\nThe goal is not to do more at once. The goal is to stay present with one useful thing.",
    author: "Alexey Trofimov",
    comments: 2,
    totalViews: 756,
    createdDaysAgo: 54,
    publishedDaysAgo: 6,
    updatedDaysAgo: 2,
    isFeatured: false,
    tags: ["productivity", "workflow"],
  },
  {
    id: "post-04",
    slug: "does-this-thing-bring-me-balance",
    title: "Does This Thing Bring Me Balance?",
    category: "Lifestyle",
    format: "image",
    status: "published",
    image: "/images/diana-schroder-bode-7UeIi0gLezM-unsplash.jpg",
    excerpt:
      "Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla.",
    content:
      "Balance is often a question of what to remove rather than what to add.\n\nThe best habits are the ones that protect your energy while still helping you move forward.\n\nWhen something constantly leaves you heavy, it deserves a closer look.",
    author: "Alexey Trofimov",
    comments: 1,
    totalViews: 1402,
    createdDaysAgo: 74,
    publishedDaysAgo: 10,
    updatedDaysAgo: 4,
    isFeatured: false,
    tags: ["balance", "lifestyle"],
  },
  {
    id: "post-05",
    slug: "how-to-feel-joy-and-happiness",
    title: "How To Feel Joy And Happiness",
    category: "Photography",
    format: "image",
    status: "published",
    image: "/images/sincerely-media-ez9IPcFL5r8-unsplash.jpg",
    excerpt:
      "Discover the small daily choices and mental shifts that allow you to welcome genuine joy, presence, and calm appreciation into your routine.",
    content:
      "Joy and happiness are not destinations we arrive at once all our tasks are complete. They are qualities we cultivate in the present moment.\n\nTaking time to pause, notice the quiet around us, and appreciate simple conversations can shift our entire daily perspective.\n\nTrue happiness is found not in having more, but in needing less.",
    author: "Alexey Trofimov",
    comments: 8,
    totalViews: 3412,
    createdDaysAgo: 90,
    publishedDaysAgo: 15,
    updatedDaysAgo: 5,
    isFeatured: true,
    tags: ["joy", "happiness", "photography"],
  },
  {
    id: "post-06",
    slug: "what-to-do-if-there-is-no-inspiration",
    title: "What To Do If There Is No Inspiration",
    category: "Lifestyle",
    format: "image",
    status: "published",
    image: "/images/sincerely-media-h140-unsplash.jpg",
    excerpt:
      "Quisque id odio. Praesent venenatis metus at tortor pulvinar varius. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
    content:
      "Inspiration does not always arrive before the work. Sometimes it follows the work.\n\nA tiny first draft, a walk, or a change of scene can be enough to restart momentum.\n\nThe secret is not forcing brilliance. It is staying close to motion.",
    author: "Alexey Trofimov",
    comments: 8,
    totalViews: 5352,
    createdDaysAgo: 118,
    publishedDaysAgo: 18,
    updatedDaysAgo: 6,
    isFeatured: false,
    tags: ["inspiration", "creative"],
  },
  {
    id: "post-07",
    slug: "useful-things-for-better-productivity",
    title: "Useful Things For Better Productivity",
    category: "Minimalism",
    format: "image",
    status: "published",
    image: "/images/jocelyn-morales-h86-unsplash.jpg",
    excerpt:
      "Proin viverra, ligula sit amet ultrices semper, ligula arcu tristique sapien, a accumsan nisi mauris ac eros. Fusce neque. Suspendisse faucibus.",
    content:
      "The right tools do not replace discipline, but they can remove friction.\n\nA calmer desk, a reliable checklist, and a visible weekly plan often beat complicated systems.\n\nGood productivity tools should disappear into the background and let the work stay in front.",
    author: "Alexey Trofimov",
    comments: 3,
    totalViews: 1470,
    createdDaysAgo: 130,
    publishedDaysAgo: 26,
    updatedDaysAgo: 9,
    isFeatured: true,
    tags: ["productivity", "tools"],
  },
  {
    id: "post-08",
    slug: "how-has-minimalism-affected-your-life",
    title: "How Has Minimalism Affected Your Life?",
    category: "Minimalism",
    format: "image",
    status: "published",
    image: "/images/ina-carolino-jOoEo2GvZvg-unsplash.jpg",
    excerpt:
      "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Pellentesque dapibus hendrerit tortor. Praesent egestas tristique nibh.",
    content:
      "Minimalism can change more than your room. It can change how you decide, rest, and respond.\n\nOnce life becomes less crowded, your attention starts returning to the things that deserve it.\n\nMany people discover that simplicity feels less like losing and more like recovering.",
    author: "Alexey Trofimov",
    comments: 4,
    totalViews: 1039,
    createdDaysAgo: 145,
    publishedDaysAgo: 34,
    updatedDaysAgo: 11,
    isFeatured: true,
    tags: ["wellness", "minimalism"],
  },
  {
    id: "post-09",
    slug: "the-simple-joy-of-housekeeping",
    title: "The Simple Joy Of Housekeeping",
    category: "Workflow",
    format: "image",
    status: "published",
    image: "/images/sarah-dorweiler-7tFlUFGa7Dk-unsplash-v2.jpg",
    excerpt:
      "Care for the little details and your space starts caring for you back. Housekeeping is less about perfection and more about rhythm, comfort, and presence.",
    content:
      "Housekeeping can become a grounding ritual when it is not rushed.\n\nA few repeated habits make the house feel ready for work, prayer, guests, and ordinary afternoons.\n\nOrder is not the point by itself. Peace is.",
    author: "Alexey Trofimov",
    comments: 1,
    totalViews: 968,
    createdDaysAgo: 82,
    publishedDaysAgo: 41,
    updatedDaysAgo: 12,
    isFeatured: true,
    tags: ["workflow", "housekeeping"],
  },
  {
    id: "post-10",
    slug: "small-home-habits-that-make-a-big-difference",
    title: "Small Home Habits That Make A Big Difference",
    category: "Minimalism",
    format: "image",
    status: "published",
    image: "/images/sarah-dorweiler-7tFlUFGa7Dk-unsplash-v2.jpg",
    excerpt:
      "Small habits create a home that feels lighter every week. Quiet resets, better surfaces, and fewer forgotten chores have an outsized impact over time.",
    content:
      "A calmer home is usually built through repetition, not one dramatic weekend.\n\nTen-minute resets, one-touch tidying, and clear storage rules often work better than perfect plans.\n\nA softer home rhythm creates more space for attention, guests, and rest.",
    author: "Alexey Trofimov",
    comments: 2,
    totalViews: 1248,
    createdDaysAgo: 58,
    publishedDaysAgo: 29,
    updatedDaysAgo: 3,
    isFeatured: false,
    tags: ["home", "minimalism"],
  },
  {
    id: "draft-01",
    slug: "quiet-morning-rituals-for-better-work",
    title: "Quiet Morning Rituals For Better Work",
    category: "Productivity",
    format: "image",
    status: "draft",
    image: "/images/ina-carolino-jOoEo2GvZvg-unsplash.jpg",
    excerpt:
      "A draft about building a calmer first hour so the rest of the workday starts with direction instead of noise.",
    content:
      "Morning rituals do not need to be long to be useful.\n\nA five-minute plan and one clear priority can completely change how the day opens.",
    author: "Admin",
    comments: 0,
    totalViews: 0,
    createdDaysAgo: 5,
    updatedDaysAgo: 0,
    tags: ["draft", "productivity"],
  },
  {
    id: "draft-02",
    slug: "desk-reset-checklist",
    title: "Desk Reset Checklist",
    category: "Minimalism",
    format: "image",
    status: "draft",
    image: "/images/bench-accounting-h51-unsplash.jpg",
    excerpt:
      "A draft checklist for resetting your workspace at the end of the day so the next session begins clean.",
    content:
      "The easiest way to start tomorrow well is to finish today with a small reset.\n\nClear surfaces create less resistance when you sit down again.",
    author: "Admin",
    comments: 0,
    totalViews: 0,
    createdDaysAgo: 12,
    updatedDaysAgo: 1,
    tags: ["draft", "desk"],
  },
  {
    id: "draft-03",
    slug: "editing-photos-for-a-soft-look",
    title: "Editing Photos For A Soft Look",
    category: "Photography",
    format: "image",
    status: "draft",
    image: "/images/jocelyn-morales-h86-unsplash.jpg",
    excerpt:
      "A photography draft focused on preserving softness, light, and room tones without pushing the image too far.",
    content:
      "Gentle editing works best when the original photo already has calm light and simple composition.\n\nThe edit should support the feeling, not replace it.",
    author: "Admin",
    comments: 0,
    totalViews: 0,
    createdDaysAgo: 18,
    updatedDaysAgo: 2,
    tags: ["draft", "photography"],
  },
];
const SEEDED_POST_SLUGS = new Set(SEED_POSTS.map((post) => post.slug));

// slugify and getDateKey are re-exported from @/lib/utils for backward compatibility
export { slugify, getDateKey } from "@/lib/utils";

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildDateFromNow(now, daysAgo, hour = 10, minute = 0) {
  const target = addDays(now, -daysAgo);
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    hour,
    minute,
    0,
    0
  );
}

function sanitizeFileName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isManagedUploadPath(value) {
  return typeof value === "string" && value.startsWith(MANAGED_UPLOAD_PREFIX);
}

function normalizeTags(tags) {
  let list = [];
  if (Array.isArray(tags)) {
    list = tags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
  } else if (typeof tags === "string") {
    list = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return list.map(toTitleCase);
}

function buildSeedViewsByDate(totalViews, publishedAt, now) {
  if (!publishedAt || totalViews <= 0) {
    return {};
  }

  const days = Math.max(
    1,
    Math.min(
      90,
      Math.floor((new Date(now).getTime() - new Date(publishedAt).getTime()) / (24 * 60 * 60 * 1000)) + 1
    )
  );
  const weights = Array.from({ length: days }, (_, index) => {
    const progress = (index + 1) / days;
    return 1.15 + progress * 1.65 + Math.sin((index + 1) / 2.8) * 0.18;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = totalViews;

  return weights.reduce((map, weight, index) => {
    const currentDate = addDays(new Date(publishedAt), index);
    const dateKey = getDateKey(currentDate);
    const value =
      index === weights.length - 1
        ? remaining
        : Math.max(0, Math.round((weight / totalWeight) * totalViews));

    map[dateKey] = value;
    remaining -= value;
    return map;
  }, {});
}

function toStoredSeedPost(seed, now) {
  const createdAt = buildDateFromNow(now, seed.createdDaysAgo, 9, 15);
  const updatedAt = buildDateFromNow(now, seed.updatedDaysAgo, 11, 30);
  const publishedAt =
    seed.status === "published"
      ? buildDateFromNow(now, seed.publishedDaysAgo, 10, 0)
      : null;

  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    category: seed.category,
    format: seed.format ?? "image",
    status: seed.status,
    author: seed.author ?? "Admin",
    excerpt: seed.excerpt,
    content: seed.content,
    image: seed.image ?? PLACEHOLDER_IMAGE,
    galleryImages: seed.galleryImages ?? [],
    videoUrl: seed.videoUrl ?? "",
    audioUrl: seed.audioUrl ?? "",
    tags: normalizeTags(seed.tags),
    comments: seed.comments ?? 0,
    totalViews: seed.totalViews ?? 0,
    viewsByDate: buildSeedViewsByDate(seed.totalViews ?? 0, publishedAt, now),
    isSticky: Boolean(seed.isSticky),
    isFeatured: Boolean(seed.isFeatured),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
  };
}

function createSeedPosts(now = new Date()) {
  return SEED_POSTS.map((seed) => toStoredSeedPost(seed, now));
}

async function ensureDatabaseSeeded() {
  if (useLocalFallback || isSeededChecked) {
    return;
  }
  try {
    // 1. Check persistent flag first to prevent re-seeding if all posts were deleted
    const { data: marker, error: markerError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "posts_seeded")
      .maybeSingle();

    if (markerError) {
      console.warn("[PostStore] Supabase database connection failed while checking seed status, using local offline fallback:", markerError.message || markerError);
      useLocalFallback = true;
      return;
    }

    if (marker) {
      isSeededChecked = true;
      return;
    }

    // 2. No persistent flag found, check current post count
    const { count, error: countError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.warn("[PostStore] Supabase database connection failed, using local offline fallback:", countError.message || countError);
      useLocalFallback = true;
      return;
    }

    isSeededChecked = true;

    if (count === 0) {
      console.log("Database table 'posts' is empty. Seeding posts...");
      const seedPosts = createSeedPosts(new Date());
      const { error: insertError } = await supabase
        .from("posts")
        .upsert(seedPosts, { onConflict: "id", ignoreDuplicates: true });
      if (insertError) {
        console.error("Error seeding posts:", insertError.message || insertError.details || insertError.hint || JSON.stringify(insertError));
      } else {
        console.log("Database seeded successfully.");
        // Mark as seeded permanently in the database
        await supabase.from("app_settings").upsert({
          key: "posts_seeded",
          value: { seeded: true, at: new Date().toISOString() },
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      }
    } else {
      // Table already has posts, mark as seeded permanently to avoid re-seeding if the posts are later cleared
      await supabase.from("app_settings").upsert({
        key: "posts_seeded",
        value: { seeded: true, at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
    }
  } catch (err) {
    console.warn("[PostStore] Failed to check database, using local offline fallback:", err);
    useLocalFallback = true;
  }
}

function normalizeGalleryItems(record) {
  const rawGallery =
    Array.isArray(record.gallery) && record.gallery.length > 0
      ? record.gallery
      : Array.isArray(record.galleryImages)
        ? record.galleryImages
        : [];

  return rawGallery
    .map((item) => {
      if (typeof item === "string") {
        return { image: item.trim(), text: "" };
      }

      const image = String(item?.image ?? item?.imageUrl ?? item?.src ?? "").trim();
      const text = String(item?.text ?? item?.caption ?? "").trim();
      return {
        ...item,
        image,
        text
      };
    })
    .filter((item) => item.image);
}

let cachedAdminName = null;
let lastCacheTime = 0;

function getAdminName() {
  const now = Date.now();
  if (cachedAdminName && now - lastCacheTime < 2000) {
    return cachedAdminName;
  }

  try {
    const users = readSeededRuntimeJsonSync("users.json", []);
    if (Array.isArray(users)) {
      const admin = users.find((u) => u.role === "admin");
      if (admin && admin.name) {
        cachedAdminName = admin.name;
        lastCacheTime = now;
        return admin.name;
      }
    }
  } catch (err) {
    console.error("Failed to read admin name:", err);
  }

  return "Admin";
}

function parsePost(record) {
  const gallery = normalizeGalleryItems(record);
  const adminName = getAdminName();

  const isGalleryFormat = record.format === "gallery";
  const sliderItems = isGalleryFormat ? gallery.filter(item => item.isSlider || !item.isExtra) : [];
  const extraImages = isGalleryFormat ? gallery.filter(item => item.isExtra) : gallery;

  const rawAuthor = record.author || adminName;
  const emailMatch = rawAuthor.match(/<([^>]+)>/);
  const authorEmail = emailMatch ? emailMatch[1].trim() : null;
  const cleanAuthor = rawAuthor.replace(/\s*<[^>]+>/, "").trim();

  return {
    ...record,
    gallery,
    galleryImages: sliderItems.map((item) => item.image),
    extraImages,
    author: cleanAuthor,
    authorEmail,
    createdAtDate: new Date(record.createdAt),
    updatedAtDate: new Date(record.updatedAt),
    publishedAtDate: record.publishedAt ? new Date(record.publishedAt) : null,
  };
}

function sortPublishedPosts(posts) {
  return [...posts].sort(
    (left, right) =>
      right.publishedAtDate.getTime() - left.publishedAtDate.getTime()
  );
}

function isSeededPost(post) {
  return SEEDED_POST_SLUGS.has(post.slug);
}

function makeUniqueSlug(posts, desiredSlug, currentPostId = null) {
  const normalized = slugify(desiredSlug) || "untitled-post";
  const occupied = new Set(
    posts
      .filter((post) => post.id !== currentPostId)
      .map((post) => post.slug)
  );

  if (!occupied.has(normalized)) {
    return normalized;
  }

  let counter = 2;
  while (occupied.has(`${normalized}-${counter}`)) {
    counter += 1;
  }

  return `${normalized}-${counter}`;
}

function getFallbackImageForFormat(format) {
  if (format === "video") {
    return "/images/clayton-chapman-1094203-unsplash.jpg";
  }

  if (format === "audio") {
    return "/images/sincerely-media-h140-unsplash.jpg";
  }

  return PLACEHOLDER_IMAGE;
}

async function saveUploadedMedia(file, slug, mediaKind) {
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) {
    return null;
  }

  const kindConfig = {
    image: { mimePrefix: "image/", fallbackExtension: ".jpg" },
    video: { mimePrefix: "video/", fallbackExtension: ".mp4" },
    audio: { mimePrefix: "audio/", fallbackExtension: ".mp3" },
  }[mediaKind];

  if (!kindConfig) {
    return null;
  }

  const mimeType = String(file.type ?? "");
  if (!mimeType.startsWith(kindConfig.mimePrefix)) {
    return null;
  }

  const extension =
    path.extname(file.name || "").toLowerCase() || kindConfig.fallbackExtension;
  const safeBase = sanitizeFileName(slug).slice(0, 60) || "post";
  const fileName = `${safeBase}-${mediaKind}-${Date.now()}${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from("blog-media")
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase storage upload error:", error.message || error);
    // Return null instead of throwing â€” post will save without uploaded media
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("blog-media")
    .getPublicUrl(fileName);

  return publicUrl;
}

async function cleanupManagedUploads(urls) {
  const fileNames = urls
    .filter((url) => typeof url === "string" && url.includes("/storage/v1/object/public/blog-media/"))
    .map((url) => url.split("/blog-media/").pop())
    .filter(Boolean);

  if (fileNames.length === 0) return;

  const { error } = await supabase.storage
    .from("blog-media")
    .remove(fileNames);

  if (error) {
    console.error("Supabase storage delete error:", error);
  }
}

async function buildPostPayload(posts, source, existingPost = null) {
  const now = new Date();
  const rawTitle = String(source.title ?? "").trim();
  const rawSlug = String(source.slug ?? "").trim();
  const rawCategory = toTitleCase(String(source.category ?? "").trim());
  const rawExcerpt = String(source.excerpt ?? "").trim();
  const rawContent = String(source.content ?? "").trim();
  const rawStatus = String(source.status ?? "").trim().toLowerCase();
  const rawFormat = String(source.format ?? "").trim().toLowerCase();
  const rawImageUrl = String(source.imageUrl ?? "").trim();
  const rawVideoUrl = String(source.videoUrl ?? "").trim();
  const rawAudioUrl = String(source.audioUrl ?? "").trim();
  const tags = normalizeTags(source.tags);
  const isFeatured = source.isFeatured === true || source.isFeatured === "true" || source.isFeatured === "on";
  const isSticky = source.isSticky === true || source.isSticky === "true" || source.isSticky === "on";
  const seoTitle = String(source.seoTitle ?? "").trim();
  const seoDescription = String(source.seoDescription ?? "").trim();
  const ogImage = String(source.ogImage ?? "").trim();

  if (!rawTitle) {
    return { error: "Post title is required." };
  }

  if (!rawCategory) {
    return { error: "Category is required." };
  }

  if (!rawExcerpt) {
    return { error: "Short excerpt is required." };
  }

  if (!rawContent) {
    return { error: "Post content is required." };
  }

  const status = rawStatus === "draft" ? "draft" : "published";
  const format = ["image", "video", "gallery", "audio"].includes(rawFormat) ? rawFormat : "image";
  const nextSlug = makeUniqueSlug(
    posts,
    rawSlug || rawTitle,
    existingPost?.id ?? null
  );

  if (
    format === "video" &&
    !rawVideoUrl &&
    !source.videoFile &&
    !(existingPost?.format === "video" && existingPost.videoUrl)
  ) {
    return { error: "Add a video URL or upload a video file for this post." };
  }

  if (
    format === "audio" &&
    !rawAudioUrl &&
    !source.audioFile &&
    !(existingPost?.format === "audio" && existingPost.audioUrl)
  ) {
    return { error: "Add an audio URL or upload an audio file for this post." };
  }

  const uploadedImage = await saveUploadedMedia(source.featuredImageFile, nextSlug, "image");
  const uploadedVideo =
    format === "video" ? await saveUploadedMedia(source.videoFile, nextSlug, "video") : null;
  const uploadedAudio =
    format === "audio" ? await saveUploadedMedia(source.audioFile, nextSlug, "audio") : null;
  let image =
    uploadedImage ||
    (format === "gallery" ? null : rawImageUrl) ||
    (format === "gallery" ? null : existingPost?.image);
  const videoUrl =
    format === "video"
      ? uploadedVideo || rawVideoUrl || existingPost?.videoUrl || ""
      : "";
  const audioUrl =
    format === "audio"
      ? uploadedAudio || rawAudioUrl || existingPost?.audioUrl || ""
      : "";

  if (format === "video" && !videoUrl) {
    return { error: "Upload a valid video file or add a video URL for this post." };
  }

  if (format === "audio" && !audioUrl) {
    return { error: "Upload a valid audio file or add an audio URL for this post." };
  }

  const nextPublishedAt =
    status === "published"
      ? existingPost?.publishedAt ?? now.toISOString()
      : null;

  let gallery = [];
  if (format === "gallery" || format === "image" || format === "video" || format === "audio") {
    try {
      const itemsJson = source.galleryItemsJson;
      const extraItemsJson = source.extraImagesJson;

      let sliderItems = [];
      if (itemsJson) {
        const rawItems = JSON.parse(itemsJson);
        const gallerySourceItems = Array.isArray(rawItems) ? rawItems : [];
        const formData = source.formDataRef;
        sliderItems = await Promise.all(
          gallerySourceItems.map(async (item) => {
            let imageUrl = item.imageUrl || item.image || item.src || "";
            if (item.hasFile && formData) {
              const file = formData.get(`gallery_file_${item.id}`);
              if (file) {
                const uploaded = await saveUploadedMedia(file, `${nextSlug}-${item.id}`, "image");
                if (uploaded) {
                  imageUrl = uploaded;
                }
              }
            }
            return {
              image: imageUrl,
              text: item.text || "",
              overlayText: !!item.overlayText,
              isSlider: format === "gallery",
              isExtra: false,
            };
          })
        );
        sliderItems = sliderItems.filter((item) => item.image);
      } else if (existingPost && Array.isArray(existingPost.gallery)) {
        sliderItems = normalizeGalleryItems(existingPost).filter(item => item.isSlider || !item.isExtra);
      } else {
        const oldGalleryImages = existingPost?.galleryImages || [];
        if (oldGalleryImages.length > 0) {
          sliderItems = normalizeGalleryItems({ galleryImages: oldGalleryImages }).map(item => ({
            ...item,
            isSlider: format === "gallery",
            isExtra: false
          }));
        } else {
          sliderItems = format === "gallery" ? [{ image, text: "", isSlider: true, isExtra: false }] : [];
        }
      }

      let extraItems = [];
      if (extraItemsJson) {
        const rawExtraItems = JSON.parse(extraItemsJson);
        const extraSourceItems = Array.isArray(rawExtraItems) ? rawExtraItems : [];
        const formData = source.formDataRef;
        extraItems = await Promise.all(
          extraSourceItems.map(async (item) => {
            let imageUrl = item.imageUrl || item.image || item.src || "";
            if (item.hasFile && formData) {
              const file = formData.get(`gallery_file_${item.id}`);
              if (file) {
                const uploaded = await saveUploadedMedia(file, `${nextSlug}-extra-${item.id}`, "image");
                if (uploaded) {
                  imageUrl = uploaded;
                }
              }
            }
            return {
              image: imageUrl,
              text: item.text || "",
              overlayText: !!item.overlayText,
              isSlider: false,
              isExtra: true,
            };
          })
        );
        extraItems = extraItems.filter((item) => item.image);
      } else if (existingPost && Array.isArray(existingPost.gallery)) {
        extraItems = normalizeGalleryItems(existingPost).filter(item => item.isExtra);
      }

      gallery = [...sliderItems, ...extraItems];
    } catch (e) {
      console.error("Error parsing gallery items:", e);
    }
  }

  if (!image) {
    if (format === "gallery" && gallery.length > 0) {
      image = gallery[0].image;
    } else {
      image = getFallbackImageForFormat(format);
    }
  }

  return {
    id:
      existingPost?.id ??
      `post-${String(
        posts.reduce((max, post) => {
          const numericPart = Number.parseInt(String(post.id).replace(/\D/g, ""), 10);
          return Number.isNaN(numericPart) ? max : Math.max(max, numericPart);
        }, 0) + 1
      ).padStart(2, "0")}`,
    slug: nextSlug,
    title: rawTitle,
    category: rawCategory,
    format,
    status,
    author: source.author ?? existingPost?.author ?? "Admin",
    excerpt: rawExcerpt,
    content: rawContent,
    image,
    galleryImages: gallery.map((item) => item.image),
    gallery,
    videoUrl,
    audioUrl,
    tags,
    comments: existingPost?.comments ?? 0,
    totalViews: existingPost?.totalViews ?? 0,
    viewsByDate: existingPost?.viewsByDate ?? {},
    isSticky,
    isFeatured,
    seoTitle,
    seoDescription,
    ogImage,
    createdAt: existingPost?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: nextPublishedAt,
  };
}

export async function createPostRecord(source) {
  const { data: existingSlugs, error: slugError } = await supabase
    .from("posts")
    .select("id, slug");

  if (slugError) {
    console.error("Error verifying post uniqueness:", slugError);
    return { error: "Failed to verify post uniqueness." };
  }

  const payload = await buildPostPayload(existingSlugs || [], source);
  if (payload.error) {
    return payload;
  }

  let { data, error } = await supabase
    .from("posts")
    .insert([payload])
    .select()
    .single();

  // Graceful fallback: if Supabase rejects unknown SEO columns (schema hasn't been migrated yet),
  // retry without them so the post still saves correctly.
  if (error && (error.code === "42703" || error.message?.includes("column") || error.message?.includes("seoTitle") || error.message?.includes("seoDescription") || error.message?.includes("ogImage"))) {
    console.warn("SEO columns not found in DB, retrying without them:", error.message);
    const { seoTitle: _s1, seoDescription: _s2, ogImage: _s3, ...payloadWithoutSeo } = payload;
    const retry = await supabase
      .from("posts")
      .insert([payloadWithoutSeo])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("Error creating post record:", error);
    return { error: "Failed to create post record in database." };
  }

  return { post: parsePost(data) };
}

export async function updatePostRecord(slug, source) {
  const { data: existingPost, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError || !existingPost) {
    return { error: "Post not found." };
  }

  const { data: allPosts, error: listError } = await supabase
    .from("posts")
    .select("id, slug");

  if (listError) {
    console.error("Error listing posts for update check:", listError);
    return { error: "Failed to verify post uniqueness." };
  }

  const payload = await buildPostPayload(allPosts || [], source, existingPost);
  if (payload.error) {
    return payload;
  }

  let { data, error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", existingPost.id)
    .select()
    .single();

  // Graceful fallback: retry without SEO columns if schema doesn't have them yet
  if (error && (error.code === "42703" || error.message?.includes("column") || error.message?.includes("seoTitle") || error.message?.includes("seoDescription") || error.message?.includes("ogImage"))) {
    console.warn("SEO columns not found in DB, retrying without them:", error.message);
    const { seoTitle: _s1, seoDescription: _s2, ogImage: _s3, ...payloadWithoutSeo } = payload;
    const retry = await supabase
      .from("posts")
      .update(payloadWithoutSeo)
      .eq("id", existingPost.id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("Error updating post record:", error);
    return { error: "Failed to update post in database." };
  }

  const previousPost = existingPost;
  const oldGalleryPaths = Array.isArray(previousPost.gallery) ? previousPost.gallery.map((item) => item.image) : [];
  const newGalleryPaths = Array.isArray(payload.gallery) ? payload.gallery.map((item) => item.image) : [];
  const galleryToClean = oldGalleryPaths.filter((val) => val && !newGalleryPaths.includes(val));

  await cleanupManagedUploads([
    ...[previousPost.image, previousPost.videoUrl, previousPost.audioUrl].filter(
      (value) => value && ![payload.image, payload.videoUrl, payload.audioUrl].includes(value)
    ),
    ...galleryToClean,
  ]);

  return { post: parsePost(data) };
}

export async function deletePostRecord(slug) {
  const { data: target, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError || !target) {
    return { error: "Post not found." };
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", target.id);

  if (deleteError) {
    console.error("Error deleting post from database:", deleteError);
    return { error: "Failed to delete post from database." };
  }

  const galleryPaths = Array.isArray(target.gallery) ? target.gallery.map((item) => item.image) : [];
  await cleanupManagedUploads([target.image, target.videoUrl, target.audioUrl, ...galleryPaths]);

  return { deleted: parsePost(target) };
}

export async function getAllPosts() {
  await ensureDatabaseSeeded();
  if (useLocalFallback) {
    return getLocalFallbackPosts();
  }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching all posts:", error);
      return [];
    }

    return data.map(parsePost);
  } catch (err) {
    console.error("Failed to fetch all posts:", err);
    return [];
  }
}

export async function getPostBySlug(slug) {
  await ensureDatabaseSeeded();
  if (useLocalFallback) {
    return getLocalFallbackPosts().find((p) => p.slug === slug) || null;
  }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error fetching post by slug:", error);
      return null;
    }

    return data ? parsePost(data) : null;
  } catch (err) {
    console.error("Failed to fetch post by slug:", err);
    return null;
  }
}

export async function getPublishedPosts() {
  await ensureDatabaseSeeded();
  if (useLocalFallback) {
    const localPublished = getLocalFallbackPosts().filter(
      (post) => post.status === "published" && post.publishedAt
    );
    return sortPublishedPosts(localPublished);
  }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .not("publishedAt", "is", null)
      .order("publishedAt", { ascending: false });

    if (error) {
      console.error("Error fetching published posts:", error.message || error);
      return [];
    }

    return data.map(parsePost);
  } catch (err) {
    console.error("Failed to fetch published posts:", err);
    return [];
  }
}

function sortStickyPostsFirst(posts) {
  const stickyPosts = posts.filter((post) => post.isSticky);
  const regularPosts = posts.filter((post) => !post.isSticky);
  return [...stickyPosts, ...regularPosts];
}

export async function getHomepageFeed(page = 1, pageSize = 8, filter = {}) {
  let publishedPosts = await getPublishedPosts();

  if (filter.category) {
    publishedPosts = publishedPosts.filter(
      (post) => post.category && post.category.toLowerCase() === filter.category.toLowerCase()
    );
  }

  if (filter.tag) {
    publishedPosts = publishedPosts.filter(
      (post) => post.tags && post.tags.map((t) => t.toLowerCase()).includes(filter.tag.toLowerCase())
    );
  }

  if (filter.query) {
    const q = filter.query.toLowerCase();
    publishedPosts = publishedPosts.filter(
      (post) => post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    );
  }

  const seededPosts = publishedPosts.filter(isSeededPost);
  const customPosts = publishedPosts.filter((post) => !isSeededPost(post));
  const orderedHomepagePosts = [
    ...seededPosts.slice(0, SEEDED_PUBLISHED_PAGE_SIZE),
    ...customPosts,
    ...seededPosts.slice(SEEDED_PUBLISHED_PAGE_SIZE),
  ];
  const totalPages = Math.max(1, Math.ceil(orderedHomepagePosts.length / pageSize));
  const safePage = Math.min(Math.max(Number.parseInt(String(page ?? "1"), 10) || 1, 1), totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagePosts = sortStickyPostsFirst(
    orderedHomepagePosts.slice(pageStart, pageStart + pageSize)
  );
  const featuredPost = pagePosts[0] ?? orderedHomepagePosts[0] ?? null;

  const appSettings = await getAppSettings();

  // 1. Hero Slides Custom Selection
  let heroPosts = [];
  if (appSettings.homepageHeroPostSlugs && appSettings.homepageHeroPostSlugs.length > 0) {
    heroPosts = appSettings.homepageHeroPostSlugs
      .map((slug) => orderedHomepagePosts.find((p) => p.slug === slug))
      .filter(Boolean);
  }
  if (heroPosts.length === 0) {
    const heroSourcePosts = seededPosts.length > 0 ? seededPosts : orderedHomepagePosts;
    heroPosts = heroSourcePosts.filter((post) => post.isFeatured).slice(0, 4);
    if (heroPosts.length === 0) {
      heroPosts = orderedHomepagePosts.slice(0, 4);
    }
  }

  // 2. Popular Posts Custom Selection
  let popularPosts = [];
  if (appSettings.homepagePopularPostSlugs && appSettings.homepagePopularPostSlugs.length > 0) {
    popularPosts = appSettings.homepagePopularPostSlugs
      .map((slug) => orderedHomepagePosts.find((p) => p.slug === slug))
      .filter(Boolean);
  }
  if (popularPosts.length === 0) {
    popularPosts = [...orderedHomepagePosts]
      .sort((left, right) => right.totalViews - left.totalViews)
      .slice(0, 4);
  }

  // 3. Random Posts Custom Selection
  let randomPosts = [];
  if (appSettings.homepageRandomPostSlugs && appSettings.homepageRandomPostSlugs.length > 0) {
    randomPosts = appSettings.homepageRandomPostSlugs
      .map((slug) => orderedHomepagePosts.find((p) => p.slug === slug))
      .filter(Boolean);
  }
  if (randomPosts.length === 0) {
    const rotationIndex =
      orderedHomepagePosts.length > 0 ? new Date().getDate() % orderedHomepagePosts.length : 0;
    randomPosts = [
      ...orderedHomepagePosts.slice(rotationIndex),
      ...orderedHomepagePosts.slice(0, rotationIndex),
    ].slice(0, 4);
  }

  return {
    currentPage: safePage,
    totalPages,
    featuredPost,
    recentPosts: pagePosts,
    heroPosts,
    popularPosts,
    randomPosts,
  };
}

export async function getAdjacentPosts(slug) {
  const published = await getPublishedPosts();
  const currentIndex = published.findIndex((post) => post.slug === slug);
  if (currentIndex === -1) return { prev: null, next: null };
  const prev = currentIndex < published.length - 1 ? published[currentIndex + 1] : null;
  const next = currentIndex > 0 ? published[currentIndex - 1] : null;
  return { prev, next };
}

export async function incrementPostViews(slug) {
  const { data: target, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError || !target) {
    return null;
  }

  const todayKey = getDateKey(new Date());
  const newTotalViews = (target.totalViews ?? 0) + 1;
  const viewsByDate = target.viewsByDate && typeof target.viewsByDate === "object" ? target.viewsByDate : {};
  viewsByDate[todayKey] = (viewsByDate[todayKey] ?? 0) + 1;

  const { data, error } = await supabase
    .from("posts")
    .update({
      totalViews: newTotalViews,
      viewsByDate: viewsByDate
    })
    .eq("id", target.id)
    .select()
    .single();

  if (error) {
    console.error("Error incrementing post views:", error);
    return null;
  }

  return parsePost(data);
}

