import fs from "node:fs";
import path from "node:path";

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
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local:", e.message);
}

// Helper to pad values for date keys
function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateKey(date) {
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
];

async function sync() {
  const { supabaseAdmin: supabase } = await import("../src/lib/supabase.js");

  const now = new Date();
  const payloads = SEED_POSTS.map(seed => {
    const createdAt = buildDateFromNow(now, seed.createdDaysAgo, 9, 15);
    const updatedAt = buildDateFromNow(now, seed.updatedDaysAgo, 11, 30);
    const publishedAt = seed.status === "published"
      ? buildDateFromNow(now, seed.publishedDaysAgo, 10, 0)
      : null;

    return {
      id: seed.id,
      slug: seed.slug,
      title: seed.title,
      category: seed.category,
      format: seed.format,
      status: seed.status,
      author: seed.author,
      excerpt: seed.excerpt,
      content: seed.content,
      image: seed.image,
      galleryImages: seed.galleryImages ?? [],
      videoUrl: seed.videoUrl ?? "",
      audioUrl: seed.audioUrl ?? "",
      tags: seed.tags,
      comments: seed.comments,
      totalViews: seed.totalViews,
      viewsByDate: buildSeedViewsByDate(seed.totalViews, publishedAt, now),
      isSticky: Boolean(seed.isSticky),
      isFeatured: Boolean(seed.isFeatured),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
    };
  });

  console.log("Cleaning up old seed posts to avoid unique slug constraint violations...");
  const seedIds = SEED_POSTS.map(s => s.id);
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .in("id", seedIds);

  if (deleteError) {
    console.error("Error deleting old seed posts:", deleteError.message || deleteError);
    process.exit(1);
  }

  console.log("Inserting fresh aligned seed posts to Supabase database...");
  const { data, error } = await supabase
    .from("posts")
    .insert(payloads);

  if (error) {
    console.error("Error inserting posts:", error.message || error);
    process.exit(1);
  }

  console.log("Successfully synchronized seed posts!");
  process.exit(0);
}

sync().catch(e => {
  console.error("Sync script failed:", e);
  process.exit(1);
});
