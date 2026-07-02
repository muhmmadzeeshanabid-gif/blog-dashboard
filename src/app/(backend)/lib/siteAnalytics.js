import { getAllPosts } from "@/backend/lib/postStore";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";
import { getDateKey } from "@/lib/utils";

const ANALYTICS_FILE_NAME = "site-analytics.json";

export async function getSiteAnalytics() {
  const persistedAnalytics = await readSeededRuntimeJson(ANALYTICS_FILE_NAME, null);
  if (persistedAnalytics && typeof persistedAnalytics === "object" && !Array.isArray(persistedAnalytics)) {
    return persistedAnalytics;
  }

  const analytics = {};
  try {
    const posts = await getAllPosts();
    posts.forEach((post) => {
      const viewsByDate = post.viewsByDate || {};
      Object.entries(viewsByDate).forEach(([dateKey, views]) => {
        const v = Number(views);
        if (v <= 0) return;

        if (!analytics[dateKey]) {
          analytics[dateKey] = {
            visitors: 0,
            pageViews: 0,
            paths: {}
          };
        }

        // Use same deterministic ratio multiplier to make the transition perfectly seamless
        // visitors = approx 48% of views, pageViews = approx 155% of views
        const seedVisRatio = 0.48;
        const seedPvRatio = 1.55;

        analytics[dateKey].pageViews += Math.round(v * seedPvRatio);
        analytics[dateKey].visitors += Math.round(v * seedVisRatio);

        const postPath = `/posts/${post.slug}`;
        analytics[dateKey].paths[postPath] = (analytics[dateKey].paths[postPath] || 0) + Math.round(v * seedPvRatio);
      });
    });

    await writeRuntimeJson(ANALYTICS_FILE_NAME, analytics);
    return analytics;
  } catch (err) {
    console.error("[SiteAnalytics] Failed to seed analytics:", err);
    return {};
  }
}

export async function recordVisit(pathname, isNewVisitor) {
  if (!pathname || pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/api")) {
    return null;
  }

  const todayKey = getDateKey(new Date());
  const analytics = await getSiteAnalytics();

  if (!analytics[todayKey]) {
    analytics[todayKey] = {
      visitors: 0,
      pageViews: 0,
      paths: {}
    };
  }

  analytics[todayKey].pageViews += 1;
  if (isNewVisitor) {
    analytics[todayKey].visitors += 1;
  }

  analytics[todayKey].paths[pathname] = (analytics[todayKey].paths[pathname] || 0) + 1;

  try {
    await writeRuntimeJson(ANALYTICS_FILE_NAME, analytics);
    return analytics[todayKey];
  } catch (err) {
    console.error("[SiteAnalytics] Failed to record visit:", err);
    return null;
  }
}
