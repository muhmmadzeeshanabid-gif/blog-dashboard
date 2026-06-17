import fs from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin as supabase } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "app-settings.json");
const SETTINGS_KEY = "dashboard";
const DEFAULT_POSTS_PER_PAGE = 8;
const MIN_POSTS_PER_PAGE = 1;
const MAX_POSTS_PER_PAGE = 30;

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

  await writeLocalSettings(settings);
  return { settings, source: "local" };
}

export function getDefaultAppSettings() {
  return normalizeSettings();
}

export { DEFAULT_POSTS_PER_PAGE, MAX_POSTS_PER_PAGE, MIN_POSTS_PER_PAGE, normalizePostsPerPage };
