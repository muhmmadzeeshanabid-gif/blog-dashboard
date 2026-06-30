import fs from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin as supabase } from "@/backend/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "app-settings.json");
const SETTINGS_KEY = "dashboard";
const DEFAULT_POSTS_PER_PAGE = 8;
const MIN_POSTS_PER_PAGE = 1;
const MAX_POSTS_PER_PAGE = 30;

const DEFAULT_ABOUT_SLIDES = [
  {
    image: "/images/about-hero.png",
    label: "About Us",
    title: "A Space for Calm, Clarity & Creativity",
    buttonText: "Our Mission",
    targetId: "mission-section",
    author: "Admin",
    date: "May 29, 2026"
  },
  {
    image: "/images/about-story.png",
    label: "Our Story",
    title: "The Story Behind ORIN",
    buttonText: "Read Our Story",
    targetId: "story-section",
    author: "Admin",
    date: "May 29, 2026"
  },
  {
    image: "/images/about-hero-3.png",
    label: "Our Community",
    title: "Join A Creative & Mindful Journey",
    buttonText: "Meet The Team",
    targetId: "team-section",
    author: "Admin",
    date: "May 29, 2026"
  }
];

const DEFAULT_CONTACT_SLIDES = [
  {
    image: "/images/contact-hero-1.png",
    label: "Contact Us",
    title: "We'd Love To Hear From You",
    buttonText: "Send Us A Message",
    author: "Admin",
    date: "May 29, 2026"
  },
  {
    image: "/images/contact-hero-2.png",
    label: "Collaborate",
    title: "Let's Build Something Great",
    buttonText: "Partner With Us",
    author: "Admin",
    date: "May 29, 2026"
  },
  {
    image: "/images/contact-hero-3.png",
    label: "Support",
    title: "Get In Touch With Our Team",
    buttonText: "Contact Support",
    author: "Admin",
    date: "May 29, 2026"
  }
];

const DEFAULT_TEAM_MEMBERS = [
  {
    id: "member-ayesha",
    name: "Ayesha Khan",
    role: "Founder & Writer",
    image: "/images/team-ayesha.png",
    bio: "Lover of minimal living, productivity, and sharing ideas that inspire.",
    socials: [
      { platform: "x", url: "#" },
      { platform: "instagram", url: "#" },
      { platform: "pinterest", url: "#" }
    ]
  },
  {
    id: "member-sara",
    name: "Sara Ahmed",
    role: "Content Creator",
    image: "/images/team-sara.png",
    bio: "Passionate about wellness, creativity, and mindful living.",
    socials: [
      { platform: "x", url: "#" },
      { platform: "instagram", url: "#" },
      { platform: "pinterest", url: "#" }
    ]
  },
  {
    id: "member-usman",
    name: "Usman Ali",
    role: "Editor & Researcher",
    image: "/images/team-usman.png",
    bio: "Focused on simplifying complex ideas into practical content.",
    socials: [
      { platform: "x", url: "#" },
      { platform: "instagram", url: "#" },
      { platform: "pinterest", url: "#" }
    ]
  }
];

function normalizeAboutSlide(s) {
  return {
    image: s?.image ? String(s.image).trim() : "/images/about-hero.png",
    label: s?.label ? String(s.label).trim() : "About Us",
    title: s?.title ? String(s.title).trim() : "",
    buttonText: s?.buttonText ? String(s.buttonText).trim() : "Learn More",
    targetId: s?.targetId ? String(s.targetId).trim() : "mission-section",
    author: s?.author ? String(s.author).trim() : "Admin",
    date: s?.date ? String(s.date).trim() : "May 29, 2026"
  };
}

function normalizeContactSlide(s) {
  return {
    image: s?.image ? String(s.image).trim() : "/images/contact-hero-1.png",
    label: s?.label ? String(s.label).trim() : "Contact Us",
    title: s?.title ? String(s.title).trim() : "",
    buttonText: s?.buttonText ? String(s.buttonText).trim() : "Contact Us",
    author: s?.author ? String(s.author).trim() : "Admin",
    date: s?.date ? String(s.date).trim() : "May 29, 2026"
  };
}

function normalizeHomeSlide(s) {
  return {
    image: s?.image ? String(s.image).trim() : "/images/bench-accounting-h51-unsplash.jpg",
    label: s?.label ? String(s.label).trim() : "Lifestyle",
    title: s?.title ? String(s.title).trim() : "",
    author: s?.author ? String(s.author).trim() : "Admin",
    date: s?.date ? String(s.date).trim() : "May 29, 2026",
    buttonText: s?.buttonText ? String(s.buttonText).trim() : "Read More",
    link: s?.link ? String(s.link).trim() : ""
  };
}

function normalizeTeamMember(m) {
  let socials = [];
  if (Array.isArray(m?.socials)) {
    socials = m.socials.map(s => ({
      platform: s?.platform ? String(s.platform).trim().toLowerCase() : "website",
      url: s?.url ? String(s.url).trim() : ""
    }));
  } else if (m?.socials && typeof m.socials === "object") {
    socials = Object.entries(m.socials)
      .map(([platform, url]) => ({
        platform: String(platform).trim().toLowerCase(),
        url: String(url).trim()
      }))
      .filter(s => s.url !== "");
  }

  return {
    id: m?.id ? String(m.id).trim() : `member-${Math.random().toString(36).slice(2, 9)}`,
    name: m?.name ? String(m.name).trim() : "New Member",
    role: m?.role ? String(m.role).trim() : "Contributor",
    image: m?.image ? String(m.image).trim() : "/images/placeholder-avatar.png",
    bio: m?.bio ? String(m.bio).trim() : "",
    socials: socials
  };
}

function normalizePostsPerPage(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_POSTS_PER_PAGE;
  }

  return Math.min(Math.max(parsed, MIN_POSTS_PER_PAGE), MAX_POSTS_PER_PAGE);
}

function normalizeSettings(value = {}) {
  return {
    postsPerPage: normalizePostsPerPage(value.postsPerPage),
    siteName: value.siteName !== undefined ? String(value.siteName).trim() : "ORIN",
    siteDescription: value.siteDescription !== undefined ? String(value.siteDescription).trim() : "Minimal Blog For WordPress - Just another WordPress site",
    allowComments: value.allowComments !== undefined ? Boolean(value.allowComments) : true,
    showSidebar: value.showSidebar !== undefined ? (value.showSidebar === true || String(value.showSidebar) === "true") : true,
    sidebarPosition: value.sidebarPosition === "left" || value.sidebarPosition === "right" ? value.sidebarPosition : "right",
    aboutSlides: Array.isArray(value.aboutSlides) ? value.aboutSlides.map(normalizeAboutSlide) : DEFAULT_ABOUT_SLIDES,
    contactSlides: Array.isArray(value.contactSlides) ? value.contactSlides.map(normalizeContactSlide) : DEFAULT_CONTACT_SLIDES,
    homeSlides: Array.isArray(value.homeSlides) ? value.homeSlides.map(normalizeHomeSlide) : [],
    homepageHeroPostSlugs: Array.isArray(value.homepageHeroPostSlugs) ? value.homepageHeroPostSlugs.map(String) : [],
    homepagePopularPostSlugs: Array.isArray(value.homepagePopularPostSlugs) ? value.homepagePopularPostSlugs.map(String) : [],
    homepageRandomPostSlugs: Array.isArray(value.homepageRandomPostSlugs) ? value.homepageRandomPostSlugs.map(String) : [],
    teamMembers: Array.isArray(value.teamMembers) ? value.teamMembers.map(normalizeTeamMember) : DEFAULT_TEAM_MEMBERS,
  };
}

async function readLocalSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings();
  }
}

async function writeLocalSettings(settings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

export async function getAppSettings() {
  noStore();
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      return normalizeSettings(data.value);
    }
  } catch (error) {
    console.warn("Unable to read app settings from Supabase:", error?.message || error);
  }

  return readLocalSettings();
}

export async function updateAppSettings(nextSettings) {
  const settings = normalizeSettings(nextSettings);

  try {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        {
          key: SETTINGS_KEY,
          value: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (!error) {
      return { settings, source: "supabase" };
    }

    console.warn("Unable to save app settings to Supabase:", error.message || error);
  } catch (error) {
    console.warn("Unable to save app settings to Supabase:", error?.message || error);
  }

  try {
    await writeLocalSettings(settings);
  } catch (err) {
    console.warn("[AppSettings] Local settings file write failed (expected on read-only environments like Vercel):", err.message);
  }
  return { settings, source: "local" };
}

export function getDefaultAppSettings() {
  return normalizeSettings();
}

export { DEFAULT_POSTS_PER_PAGE, MAX_POSTS_PER_PAGE, MIN_POSTS_PER_PAGE, normalizePostsPerPage };
