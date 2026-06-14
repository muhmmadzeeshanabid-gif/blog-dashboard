import { promises as fs } from "node:fs";
import path from "node:path";

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
    author: "Admin",
    comments: 6,
    totalViews: 4795,
    createdDaysAgo: 45,
    publishedDaysAgo: 2,
    updatedDaysAgo: 0,
    isSticky: true,
    isFeatured: true,
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
    author: "Admin",
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
    author: "Admin",
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
    author: "Admin",
    comments: 1,
    totalViews: 1402,
    createdDaysAgo: 74,
    publishedDaysAgo: 10,
    updatedDaysAgo: 4,
    tags: ["balance", "lifestyle"],
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
    author: "Admin",
    comments: 8,
    totalViews: 5352,
    createdDaysAgo: 118,
    publishedDaysAgo: 18,
    updatedDaysAgo: 6,
    isFeatured: true,
    tags: ["inspiration", "creative"],
  },
  {
    id: "post-07",
    slug: "useful-things-for-better-productivity",
    title: "Useful Things For Better Productivity",
    category: "Productivity",
    format: "image",
    status: "published",
    image: "/images/jocelyn-morales-h86-unsplash.jpg",
    excerpt:
      "Proin viverra, ligula sit amet ultrices semper, ligula arcu tristique sapien, a accumsan nisi mauris ac eros. Fusce neque. Suspendisse faucibus.",
    content:
      "The right tools do not replace discipline, but they can remove friction.\n\nA calmer desk, a reliable checklist, and a visible weekly plan often beat complicated systems.\n\nGood productivity tools should disappear into the background and let the work stay in front.",
    author: "Admin",
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
    category: "Wellness",
    format: "image",
    status: "published",
    image: "/images/ina-carolino-jOoEo2GvZvg-unsplash.jpg",
    excerpt:
      "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Pellentesque dapibus hendrerit tortor. Praesent egestas tristique nibh.",
    content:
      "Minimalism can change more than your room. It can change how you decide, rest, and respond.\n\nOnce life becomes less crowded, your attention starts returning to the things that deserve it.\n\nMany people discover that simplicity feels less like losing and more like recovering.",
    author: "Admin",
    comments: 4,
    totalViews: 1039,
    createdDaysAgo: 145,
    publishedDaysAgo: 34,
    updatedDaysAgo: 11,
    tags: ["wellness", "minimalism"],
  },
  {
    id: "post-09",
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
    author: "Admin",
    comments: 2,
    totalViews: 1248,
    createdDaysAgo: 58,
    publishedDaysAgo: 29,
    updatedDaysAgo: 3,
    tags: ["home", "minimalism"],
  },
  {
    id: "post-10",
    slug: "the-simple-joy-of-housekeeping",
    title: "The Simple Joy Of Housekeeping",
    category: "Lifestyle",
    format: "image",
    status: "published",
    image: "/images/sincerely-media-ez9IPcFL5r8-unsplash.jpg",
    excerpt:
      "Care for the little details and your space starts caring for you back. Housekeeping is less about perfection and more about rhythm, comfort, and presence.",
    content:
      "Housekeeping can become a grounding ritual when it is not rushed.\n\nA few repeated habits make the house feel ready for work, prayer, guests, and ordinary afternoons.\n\nOrder is not the point by itself. Peace is.",
    author: "Admin",
    comments: 1,
    totalViews: 968,
    createdDaysAgo: 82,
    publishedDaysAgo: 41,
    updatedDaysAgo: 12,
    tags: ["lifestyle", "home"],
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

function pad(value) {
  return String(value).padStart(2, "0");
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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
  if (Array.isArray(tags)) {
    return tags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
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

async function ensurePostsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(POSTS_FILE);
  } catch {
    const seedPosts = createSeedPosts(new Date());
    await fs.writeFile(POSTS_FILE, JSON.stringify(seedPosts, null, 2), "utf8");
  }
}

function normalizeStoredPost(record) {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    category: record.category,
    format: record.format ?? "image",
    status: record.status === "draft" ? "draft" : "published",
    author: record.author ?? "Admin",
    excerpt: record.excerpt ?? "",
    content: record.content ?? "",
    image: record.image ?? PLACEHOLDER_IMAGE,
    galleryImages: Array.isArray(record.galleryImages) ? record.galleryImages : [],
    gallery: Array.isArray(record.gallery) ? record.gallery : [],
    videoUrl: record.videoUrl ?? "",
    audioUrl: record.audioUrl ?? "",
    tags: normalizeTags(record.tags),
    comments: Number.isFinite(record.comments) ? record.comments : 0,
    totalViews: Number.isFinite(record.totalViews) ? record.totalViews : 0,
    viewsByDate:
      record.viewsByDate && typeof record.viewsByDate === "object" ? record.viewsByDate : {},
    isSticky: Boolean(record.isSticky),
    isFeatured: Boolean(record.isFeatured),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt ?? null,
  };
}

export async function readPostsStore() {
  await ensurePostsFile();
  const raw = await fs.readFile(POSTS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map(normalizeStoredPost) : [];
}

export async function writePostsStore(posts) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8");
}

function parsePost(record) {
  return {
    ...record,
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

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, fileName), buffer);

  return `${MANAGED_UPLOAD_PREFIX}${fileName}`;
}

async function cleanupManagedUploads(paths) {
  const uniquePaths = [...new Set(paths.filter(isManagedUploadPath))];

  await Promise.all(
    uniquePaths.map(async (uploadPath) => {
      const absolutePath = path.join(process.cwd(), "public", uploadPath.replace(/^\//, ""));

      try {
        await fs.unlink(absolutePath);
      } catch {
        // Ignore cleanup errors so CRUD actions can still succeed.
      }
    })
  );
}

async function buildPostPayload(posts, source, existingPost = null) {
  const now = new Date();
  const rawTitle = String(source.title ?? "").trim();
  const rawSlug = String(source.slug ?? "").trim();
  const rawCategory = String(source.category ?? "").trim();
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
  const image =
    uploadedImage ||
    rawImageUrl ||
    existingPost?.image ||
    getFallbackImageForFormat(format);
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
  if (format === "gallery" || format === "image") {
    try {
      const itemsJson = source.galleryItemsJson;
      if (itemsJson) {
        const rawItems = JSON.parse(itemsJson);
        const formData = source.formDataRef;
        gallery = await Promise.all(
          rawItems.map(async (item) => {
            let imageUrl = item.imageUrl || "";
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
            };
          })
        );
      } else if (existingPost && Array.isArray(existingPost.gallery)) {
        gallery = existingPost.gallery;
      } else {
        const oldGalleryImages = existingPost?.galleryImages || [];
        if (oldGalleryImages.length > 0) {
          gallery = oldGalleryImages.map((img) => ({ image: img, text: "" }));
        } else {
          gallery = format === "gallery" ? [{ image, text: "" }] : [];
        }
      }
    } catch (e) {
      console.error("Error parsing gallery items:", e);
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
    author: existingPost?.author ?? source.author ?? "Admin",
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
    createdAt: existingPost?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: nextPublishedAt,
  };
}

export async function createPostRecord(source) {
  const posts = await readPostsStore();
  const payload = await buildPostPayload(posts, source);

  if (payload.error) {
    return payload;
  }

  const nextPosts = [payload, ...posts];
  await writePostsStore(nextPosts);
  return { post: parsePost(payload) };
}

export async function updatePostRecord(slug, source) {
  const posts = await readPostsStore();
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return { error: "Post not found." };
  }

  const payload = await buildPostPayload(posts, source, posts[currentIndex]);
  if (payload.error) {
    return payload;
  }

  const nextPosts = [...posts];
  const previousPost = posts[currentIndex];
  nextPosts[currentIndex] = payload;
  await writePostsStore(nextPosts);

  const oldGalleryPaths = Array.isArray(previousPost.gallery) ? previousPost.gallery.map((item) => item.image) : [];
  const newGalleryPaths = Array.isArray(payload.gallery) ? payload.gallery.map((item) => item.image) : [];
  const galleryToClean = oldGalleryPaths.filter((val) => val && !newGalleryPaths.includes(val));

  await cleanupManagedUploads([
    ...[previousPost.image, previousPost.videoUrl, previousPost.audioUrl].filter(
      (value) => value && ![payload.image, payload.videoUrl, payload.audioUrl].includes(value)
    ),
    ...galleryToClean,
  ]);

  return { post: parsePost(payload) };
}

export async function deletePostRecord(slug) {
  const posts = await readPostsStore();
  const target = posts.find((post) => post.slug === slug);

  if (!target) {
    return { error: "Post not found." };
  }

  await writePostsStore(posts.filter((post) => post.slug !== slug));

  const galleryPaths = Array.isArray(target.gallery) ? target.gallery.map((item) => item.image) : [];
  await cleanupManagedUploads([target.image, target.videoUrl, target.audioUrl, ...galleryPaths]);

  return { deleted: parsePost(target) };
}

export async function getAllPosts() {
  const posts = await readPostsStore();
  return posts.map(parsePost);
}

export async function getPostBySlug(slug) {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getPublishedPosts() {
  const posts = await getAllPosts();
  return sortPublishedPosts(
    posts.filter((post) => post.status === "published" && post.publishedAtDate)
  );
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
  const pagePosts = orderedHomepagePosts.slice(pageStart, pageStart + pageSize);
  const featuredPost =
    pagePosts.find((post) => post.isSticky) ?? pagePosts[0] ?? orderedHomepagePosts[0] ?? null;

  const heroSourcePosts = seededPosts.length > 0 ? seededPosts : orderedHomepagePosts;
  const heroPosts = heroSourcePosts
    .filter((post) => post.isFeatured)
    .slice(0, 4);

  const popularPosts = [...orderedHomepagePosts]
    .sort((left, right) => right.totalViews - left.totalViews)
    .slice(0, 4);

  const rotationIndex =
    orderedHomepagePosts.length > 0 ? new Date().getDate() % orderedHomepagePosts.length : 0;
  const randomPosts = [
    ...orderedHomepagePosts.slice(rotationIndex),
    ...orderedHomepagePosts.slice(0, rotationIndex),
  ].slice(0, 4);

  return {
    currentPage: safePage,
    totalPages,
    featuredPost,
    recentPosts: pagePosts,
    heroPosts: heroPosts.length > 0 ? heroPosts : orderedHomepagePosts.slice(0, 4),
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
