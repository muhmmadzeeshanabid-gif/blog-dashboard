import path from "node:path";
import { stat, readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { readActionNotificationEvents, toDashboardEvent } from "@/dashboard/lib/dashboardNotifications";
import { getAllPosts } from "@/backend/lib/postStore";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_OPTIONS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "month", label: "This month" },
];

const MEDIA_TYPE_OPTIONS = [
  { key: "all", label: "All assets" },
  { key: "image", label: "Featured" },
  { key: "gallery", label: "Gallery" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
];

const MEDIA_FALLBACK_BYTES = {
  image: 1_200_000,
  gallery: 950_000,
  video: 15_000_000,
  audio: 4_200_000,
};

const MEDIA_TYPE_META = {
  image: {
    badge: "Featured image",
    cardLabel: "Image",
    accent: "#6f6fff",
    fallbackPreview: "/images/05-bench-accounting-h51-unsplash.jpg",
  },
  gallery: {
    badge: "Gallery frame",
    cardLabel: "Gallery",
    accent: "#8677ff",
    fallbackPreview: "/images/jan-pictures-cIDdZYoSeJ4-unsplash.jpg",
  },
  video: {
    badge: "Video clip",
    cardLabel: "Video",
    accent: "#4fa7ff",
    fallbackPreview: "/images/clayton-chapman-1094203-unsplash.jpg",
  },
  audio: {
    badge: "Audio track",
    cardLabel: "Audio",
    accent: "#ff8b86",
    fallbackPreview: "/images/sincerely-media-h140-unsplash.jpg",
  },
};

const MEDIA_COLLECTION_ACCENTS = [
  "#6f6fff",
  "#71d1a1",
  "#ff8a8a",
  "#f0c168",
  "#8f82ff",
];

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  })
    .format(value)
    .replace("k", "K")
    .replace("m", "M");
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRangeLabel(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const startMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(end);

  if (sameMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

function formatRelativeTime(date, now) {
  const diff = now.getTime() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return formatShortDate(date);
}

function buildPresetRange(now, key) {
  const todayEnd = endOfDay(now);

  if (key === "30d") {
    return { key, start: startOfDay(addDays(todayEnd, -29)), end: todayEnd };
  }

  if (key === "90d") {
    return { key, start: startOfDay(addDays(todayEnd, -89)), end: todayEnd };
  }

  if (key === "month") {
    return {
      key,
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: todayEnd,
    };
  }

  return { key: "7d", start: startOfDay(addDays(todayEnd, -6)), end: todayEnd };
}

function resolveRange(search = {}, now = new Date()) {
  const fromDate = parseDateInput(search.from);
  const toDate = parseDateInput(search.to);

  if (fromDate && toDate && fromDate.getTime() <= toDate.getTime()) {
    const start = startOfDay(fromDate);
    const end = endOfDay(toDate > now ? now : toDate);

    return {
      key: "custom",
      label: formatRangeLabel(start, end),
      start,
      end,
      startInput: formatDateInput(start),
      endInput: formatDateInput(end),
      days: Math.max(1, Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS) + 1),
      isCustom: true,
    };
  }

  const normalizedKey = RANGE_OPTIONS.some((option) => option.key === search.range)
    ? search.range
    : "7d";
  const preset = buildPresetRange(now, normalizedKey);

  return {
    key: preset.key,
    label: formatRangeLabel(preset.start, preset.end),
    start: preset.start,
    end: preset.end,
    startInput: formatDateInput(preset.start),
    endInput: formatDateInput(preset.end),
    days: Math.max(1, Math.round((startOfDay(preset.end) - startOfDay(preset.start)) / DAY_MS) + 1),
    isCustom: false,
  };
}

function viewsOnDate(post, date) {
  const key = formatDateInput(date);
  return Number(post.viewsByDate?.[key] ?? 0);
}

function sumViewsInRange(post, range) {
  const viewsByDate = post.viewsByDate ?? {};

  return Object.entries(viewsByDate).reduce((sum, [dateKey, value]) => {
    const date = parseDateInput(dateKey);
    if (!date) {
      return sum;
    }

    return date >= range.start && date <= range.end ? sum + Number(value ?? 0) : sum;
  }, 0);
}

function countPostsAtDate(posts, endDate) {
  return posts.filter((post) => post.createdAtDate <= endDate).length;
}

function countPublishedAtDate(posts, endDate) {
  return posts.filter(
    (post) => post.status === "published" && post.publishedAtDate && post.publishedAtDate <= endDate
  ).length;
}

function countDraftsAtDate(posts, endDate) {
  return posts.filter((post) => post.status === "draft" && post.createdAtDate <= endDate).length;
}

function createTrend(current, previous) {
  const delta = current - previous;
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : (delta / previous) * 100;
  const rounded = Math.round(Math.abs(percent));

  return {
    down: delta < 0,
    label: `${delta >= 0 ? "+" : "-"}${rounded}% vs previous period`,
  };
}

function previousRangeFor(range) {
  const previousEnd = endOfDay(addDays(range.start, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(range.days - 1)));

  return {
    start: previousStart,
    end: previousEnd,
    days: range.days,
  };
}

function createStats(posts, range) {
  const previousRange = previousRangeFor(range);
  const totalPosts = countPostsAtDate(posts, range.end);
  const totalPostsPrevious = countPostsAtDate(posts, previousRange.end);
  const published = countPublishedAtDate(posts, range.end);
  const publishedPrevious = countPublishedAtDate(posts, previousRange.end);
  const drafts = countDraftsAtDate(posts, range.end);
  const draftsPrevious = countDraftsAtDate(posts, previousRange.end);
  const currentViews = posts.reduce((sum, post) => sum + sumViewsInRange(post, range), 0);
  const previousViews = posts.reduce((sum, post) => sum + sumViewsInRange(post, previousRange), 0);

  return [
    {
      label: "Total Posts",
      value: String(totalPosts),
      trend: createTrend(totalPosts, totalPostsPrevious),
    },
    {
      label: "Published",
      value: String(published),
      trend: createTrend(published, publishedPrevious),
    },
    {
      label: "Drafts",
      value: String(drafts),
      trend: createTrend(drafts, draftsPrevious),
    },
    {
      label: "Views",
      value: formatCompactNumber(currentViews),
      trend: createTrend(currentViews, previousViews),
    },
  ];
}

function createRecentPosts(posts) {
  return posts
    .filter((post) => post.status === "published" && post.publishedAtDate)
    .sort((left, right) => right.publishedAtDate.getTime() - left.publishedAtDate.getTime())
    .slice(0, 5)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      date: formatShortDate(post.publishedAtDate),
      views: formatCompactNumber(post.totalViews ?? 0),
      image: post.image,
    }));
}

function createTrendingPosts(posts, range) {
  const previousRange = previousRangeFor(range);

  return posts
    .filter((post) => post.status === "published" && post.publishedAtDate)
    .map((post) => {
      const currentViews = sumViewsInRange(post, range);
      const previousViews = sumViewsInRange(post, previousRange);
      const trend = createTrend(currentViews, previousViews);

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        category: post.category,
        views: formatCompactNumber(post.totalViews ?? 0),
        rawViews: currentViews,
        lift: trend.label.split(" vs ")[0],
        image: post.image,
      };
    })
    .sort((left, right) => right.rawViews - left.rawViews || right.totalViews - left.totalViews);
}

function createEvents(posts, now) {
  const viewsWindow = {
    start: startOfDay(addDays(now, -1)),
    end: endOfDay(now),
  };

  const events = posts.flatMap((post) => {
    const postEvents = [];

    if (post.status === "published" && post.publishedAtDate) {
      postEvents.push({
        id: `publish-${post.id}`,
        type: "publish",
        title: `Post published "${post.title}"`,
        createdAt: post.publishedAtDate,
        unread: post.publishedAtDate >= startOfDay(addDays(now, -2)),
      });
    }

    if (post.status === "draft") {
      postEvents.push({
        id: `draft-${post.id}`,
        type: "draft",
        title: `Draft updated "${post.title}"`,
        createdAt: post.updatedAtDate,
        unread: post.updatedAtDate >= startOfDay(addDays(now, -2)),
      });
    }

    if (post.image?.includes("/uploads/posts/")) {
      postEvents.push({
        id: `media-${post.id}`,
        type: "media",
        title: `Media file added for "${post.title}"`,
        createdAt: post.createdAtDate,
        unread: post.createdAtDate >= startOfDay(addDays(now, -2)),
      });
    }

    const recentViews = sumViewsInRange(post, viewsWindow);
    if (recentViews > 0) {
      postEvents.push({
        id: `views-${post.id}`,
        type: "views",
        title: `Views climbed for "${post.title}"`,
        createdAt: post.updatedAtDate,
        unread: post.updatedAtDate >= startOfDay(addDays(now, -2)),
      });
    }

    if (post.comments > 0 && post.updatedAtDate >= startOfDay(addDays(now, -7))) {
      postEvents.push({
        id: `comment-${post.id}`,
        type: "comment",
        title: `${post.comments} comments on "${post.title}"`,
        createdAt: post.updatedAtDate,
        unread: post.updatedAtDate >= startOfDay(addDays(now, -1)),
      });
    }

    return postEvents;
  });

  return events
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10);
}

async function readSharedActionNotifications() {
  try {
    const filePath = path.join(process.cwd(), "data", "action-notifications.json");
    const data = await readFile(filePath, "utf8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => toDashboardEvent(item));
    }
  } catch (err) {
    // Ignore error if file doesn't exist
  }
  return [];
}

function normalizeComparableValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isLegacyAdminPostForUser(post, currentUser) {
  const currentEmail = normalizeComparableValue(currentUser?.email);
  const currentName = normalizeComparableValue(currentUser?.name);
  const author = normalizeComparableValue(post?.author);

  return (
    currentUser?.role === "admin" &&
    !post?.authorEmail &&
    author === "admin" &&
    (currentEmail === "admin@orin.com" || currentName === "orin admin")
  );
}

function isPostOwnedByUser(post, currentUser) {
  if (!currentUser) {
    return true;
  }

  const currentEmail = normalizeComparableValue(currentUser.email);
  const currentName = normalizeComparableValue(currentUser.name);
  const authorEmail = normalizeComparableValue(post?.authorEmail);
  const author = normalizeComparableValue(post?.author);

  if (authorEmail && currentEmail && authorEmail === currentEmail) {
    return true;
  }

  if (author && currentName && author === currentName) {
    return true;
  }

  return isLegacyAdminPostForUser(post, currentUser);
}

function matchesNotificationRecipient(event, currentUser) {
  if (!currentUser) {
    return false;
  }

  const currentEmail = normalizeComparableValue(currentUser.email);
  const currentRole = normalizeComparableValue(currentUser.role);
  const recipientEmail = normalizeComparableValue(event?.recipientEmail);
  const recipientRole = normalizeComparableValue(event?.recipientRole);

  if (recipientEmail) {
    return Boolean(currentEmail) && recipientEmail === currentEmail;
  }

  if (recipientRole) {
    return Boolean(currentRole) && recipientRole === currentRole;
  }

  return false;
}

function getEventTimestamp(event) {
  const createdAt = event?.createdAt;
  if (!(createdAt instanceof Date)) {
    return 0;
  }

  const timestamp = createdAt.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeDashboardEvents(...groups) {
  const seenIds = new Set();

  return groups
    .flat()
    .filter(Boolean)
    .sort((left, right) => getEventTimestamp(right) - getEventTimestamp(left))
    .filter((event) => {
      const eventId = String(event?.id ?? "");
      if (!eventId || seenIds.has(eventId)) {
        return false;
      }

      seenIds.add(eventId);
      return true;
    });
}

async function readScopedActionNotificationEvents(currentUser) {
  const sharedEvents = (await readSharedActionNotifications()).filter((event) =>
    matchesNotificationRecipient(event, currentUser)
  );

  try {
    const cookieStore = await cookies();
    const actionEvents = (await readActionNotificationEvents(cookieStore, currentUser)).filter((event) =>
      matchesNotificationRecipient(event, currentUser)
    );

    return mergeDashboardEvents(actionEvents, sharedEvents).slice(0, MAX_SCOPED_NOTIFICATION_EVENTS);
  } catch {
    return mergeDashboardEvents(sharedEvents).slice(0, MAX_SCOPED_NOTIFICATION_EVENTS);
  }
}

async function createDashboardEvents(posts, now, currentUser = null) {
  const generatedEvents = createEvents(posts, now);
  const scopedActionEvents = await readScopedActionNotificationEvents(currentUser);

  return mergeDashboardEvents(scopedActionEvents, generatedEvents).slice(0, MAX_NOTIFICATION_FEED_ITEMS);
}

async function createDashboardNotificationEvents(posts, now, currentUser = null) {
  const notificationPosts = currentUser
    ? posts.filter((post) => isPostOwnedByUser(post, currentUser))
    : posts;
  const generatedEvents = createEvents(notificationPosts, now);
  const scopedActionEvents = await readScopedActionNotificationEvents(currentUser);

  return mergeDashboardEvents(scopedActionEvents, generatedEvents).slice(0, MAX_NOTIFICATION_FEED_ITEMS);
}

const MAX_SCOPED_NOTIFICATION_EVENTS = 50;
const MAX_NOTIFICATION_FEED_ITEMS = 50;

function createActivity(events, range, now) {
  const filtered = events.filter(
    (event) => event.createdAt <= range.end && event.createdAt >= range.start
  );
  const source = filtered.length > 0 ? filtered : events.filter((event) => event.createdAt <= range.end);

  return source.slice(0, 7).map((event) => ({
    id: event.id,
    text: event.title,
    time: formatRelativeTime(event.createdAt, now),
  }));
}

function createNotifications(events, range, now, readNotificationIds = [], clearedNotificationIds = []) {
  return events
    .filter((event) => event.createdAt <= range.end && !clearedNotificationIds.includes(event.id))
    .map((event) => ({
      id: event.id,
      title: event.title,
      time: formatRelativeTime(event.createdAt, now),
      unread: event.unread && !readNotificationIds.includes(event.id),
      type: event.type,
    }));
}

function createGlance(posts, events, range) {
  const publishedPosts = posts.filter(
    (post) => post.status === "published" && post.publishedAtDate && post.publishedAtDate <= range.end
  );

  return [
    {
      label: "Comments",
      value: String(publishedPosts.reduce((sum, post) => sum + (post.comments ?? 0), 0)),
      icon: "fas fa-comment",
    },
    {
      label: "Live Views Today",
      value: String(
        posts.reduce((sum, post) => sum + viewsOnDate(post, range.end), 0)
      ),
      icon: "fas fa-clock",
    },
    {
      label: "Draft Posts",
      value: String(posts.filter((post) => post.status === "draft").length),
      icon: "fas fa-file-alt",
    },
    {
      label: "Media Uploads",
      value: String(events.filter((event) => event.type === "media").length),
      icon: "fas fa-image",
    },
  ];
}

function createAnalytics(posts, range) {
  const data = [];
  const start = new Date(range.start);
  
  for (let i = 0; i < range.days; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = formatDateInput(currentDate);
    
    const views = posts.reduce((sum, post) => {
      const viewsByDate = post.viewsByDate ?? {};
      return sum + Number(viewsByDate[dateKey] ?? 0);
    }, 0);
    
    const label = currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    data.push({
      label,
      views,
      date: dateKey,
    });
  }
  
  return data;
}

function createCategoryAnalytics(posts, range) {
  const categoryMap = {};

  posts.forEach((post) => {
    const category = post.category || "Uncategorized";
    const views = sumViewsInRange(post, range);

    if (!categoryMap[category]) {
      categoryMap[category] = { category, views: 0, postsCount: 0 };
    }
    categoryMap[category].views += views;

    if (post.status === "published" && post.publishedAtDate && post.publishedAtDate <= range.end) {
      categoryMap[category].postsCount += 1;
    }
  });

  return Object.values(categoryMap)
    .filter((item) => item.views > 0 || item.postsCount > 0)
    .sort((left, right) => right.views - left.views || right.postsCount - left.postsCount);
}

function createLastUpdatedMeta(now) {
  return {
    lastUpdated: now.toISOString(),
    lastUpdatedLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(now),
  };
}

function normalizePostsStatus(value) {
  return ["published", "draft"].includes(value) ? value : "all";
}

function normalizePostsPage(value, totalPages) {
  const nextPage = Number.parseInt(value ?? "1", 10);
  if (Number.isNaN(nextPage)) {
    return 1;
  }

  return Math.min(Math.max(nextPage, 1), totalPages);
}

function getMediaFileName(url) {
  if (!url) {
    return "asset";
  }

  try {
    const pathname = url.startsWith("http") ? new URL(url).pathname : url;
    const fileName = pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : "asset";
  } catch {
    return "asset";
  }
}

function getMediaExtension(fileName) {
  const extension = path.extname(fileName).replace(".", "");
  return extension ? extension.toUpperCase() : "FILE";
}

function isManagedMedia(url) {
  return url.startsWith("/uploads/posts/") || url.includes("/storage/v1/object/public/blog-media/");
}

function getMediaOriginLabel(url) {
  if (url.startsWith("/uploads/posts/")) {
    return "Local upload";
  }

  if (url.startsWith("/images/")) {
    return "Theme library";
  }

  if (url.includes("supabase.co")) {
    return "Supabase storage";
  }

  return "Linked media";
}

async function getMediaByteSize(url, type) {
  if (url.startsWith("/")) {
    try {
      const cleanPath = url.split("?")[0];
      const assetPath = path.join(
        process.cwd(),
        "public",
        ...cleanPath.replace(/^\/+/, "").split("/")
      );
      const fileStats = await stat(assetPath);

      if (fileStats.isFile()) {
        return fileStats.size;
      }
    } catch {
      // Ignore missing local assets and fall back to a type estimate.
    }
  }

  return MEDIA_FALLBACK_BYTES[type] ?? 0;
}

function createMediaSeedItems(posts) {
  return posts.flatMap((post) => {
    const shared = {
      postId: post.id,
      postSlug: post.slug,
      postTitle: post.title,
      postStatus: post.status,
      postStatusLabel: post.status === "published" ? "Published" : "Draft",
      category: post.category || "Uncategorized",
      updatedAt: post.updatedAtDate.toISOString(),
      updatedAtDate: post.updatedAtDate,
      updatedAtLabel: formatShortDate(post.updatedAtDate),
      createdAtDate: post.createdAtDate,
      sortDate: post.updatedAtDate.getTime(),
    };

    const items = [];
    const featuredImage = String(post.image ?? "").trim();

    if (featuredImage) {
      items.push({
        ...shared,
        type: "image",
        slot: "cover",
        label:
          post.format === "video"
            ? "Video cover"
            : post.format === "audio"
              ? "Audio cover"
              : "Featured image",
        note: `Attached to the ${post.status === "published" ? "live" : "draft"} post layout.`,
        url: featuredImage,
        previewUrl: featuredImage,
      });
    }

    const galleryItems =
      Array.isArray(post.gallery) && post.gallery.length > 0
        ? post.gallery
        : Array.isArray(post.galleryImages)
          ? post.galleryImages.map((image) => ({ image, text: "" }))
          : [];

    galleryItems.forEach((item, index) => {
      const galleryUrl = String(item?.image ?? item ?? "").trim();
      if (!galleryUrl) {
        return;
      }

      items.push({
        ...shared,
        type: "gallery",
        slot: `gallery-${index + 1}`,
        label: `Gallery frame ${index + 1}`,
        note: String(item?.text ?? "").trim() || "Gallery image linked to this post.",
        url: galleryUrl,
        previewUrl: galleryUrl,
      });
    });

    const videoUrl = String(post.videoUrl ?? "").trim();
    if (videoUrl) {
      items.push({
        ...shared,
        type: "video",
        slot: "video",
        label: "Video clip",
        note: "Primary video source attached to the post.",
        url: videoUrl,
        previewUrl: featuredImage || MEDIA_TYPE_META.video.fallbackPreview,
      });
    }

    const audioUrl = String(post.audioUrl ?? "").trim();
    if (audioUrl) {
      items.push({
        ...shared,
        type: "audio",
        slot: "audio",
        label: "Audio track",
        note: "Audio source attached to the post.",
        url: audioUrl,
        previewUrl: featuredImage || MEDIA_TYPE_META.audio.fallbackPreview,
      });
    }

    return items;
  });
}

async function createMediaItems(posts) {
  const seeds = createMediaSeedItems(posts);

  const assets = await Promise.all(
    seeds.map(async (asset, index) => {
      const fileName = getMediaFileName(asset.url);
      const sizeBytes = await getMediaByteSize(asset.url, asset.type);
      const typeMeta = MEDIA_TYPE_META[asset.type] ?? MEDIA_TYPE_META.image;
      const managed = isManagedMedia(asset.url);

      return {
        id: `media-${asset.postId}-${asset.slot}-${index}`,
        postId: asset.postId,
        postSlug: asset.postSlug,
        postTitle: asset.postTitle,
        postStatus: asset.postStatus,
        postStatusLabel: asset.postStatusLabel,
        category: asset.category,
        type: asset.type,
        typeLabel: typeMeta.cardLabel,
        badgeLabel: typeMeta.badge,
        accent: typeMeta.accent,
        label: asset.label,
        note: asset.note,
        url: asset.url,
        previewUrl: asset.previewUrl || typeMeta.fallbackPreview,
        fileName,
        extension: getMediaExtension(fileName),
        sizeBytes,
        sizeLabel: formatFileSize(sizeBytes),
        originLabel: getMediaOriginLabel(asset.url),
        managed,
        updatedAt: asset.updatedAt,
        updatedAtLabel: asset.updatedAtLabel,
        sortDate: asset.sortDate,
      };
    })
  );

  return assets.sort(
    (left, right) =>
      right.sortDate - left.sortDate ||
      left.postTitle.localeCompare(right.postTitle, "en", { sensitivity: "base" })
  );
}

function createMediaStats(assets, storage, now) {
  const recentBoundary = startOfDay(addDays(now, -6));
  const recentlyTouched = assets.filter(
    (asset) => new Date(asset.updatedAt) >= recentBoundary
  ).length;
  const galleryFrames = assets.filter((asset) => asset.type === "gallery").length;
  const liveAssets = assets.filter((asset) => asset.postStatus === "published");
  const livePostCount = new Set(liveAssets.map((asset) => asset.postId)).size;

  return [
    {
      label: "Library Assets",
      value: String(assets.length),
      trend: {
        down: false,
        label: `${galleryFrames} gallery frame${galleryFrames === 1 ? "" : "s"} linked`,
      },
    },
    {
      label: "Managed Uploads",
      value: String(storage.managedCount),
      trend: {
        down: false,
        label: `${storage.linkedCount} theme or external reference${storage.linkedCount === 1 ? "" : "s"}`,
      },
    },
    {
      label: "Live In Posts",
      value: String(liveAssets.length),
      trend: {
        down: false,
        label: `Across ${livePostCount} published post${livePostCount === 1 ? "" : "s"}`,
      },
    },
    {
      label: "Storage Footprint",
      value: storage.usedLabel,
      trend: {
        down: false,
        label: `${recentlyTouched} asset${recentlyTouched === 1 ? "" : "s"} touched this week`,
      },
    },
  ];
}

function createMediaCollections(assets) {
  const grouped = new Map();

  assets.forEach((asset) => {
    const key = asset.category || "Uncategorized";
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
      existing.liveCount += asset.postStatus === "published" ? 1 : 0;
      existing.types.add(asset.typeLabel);
      if (!existing.coverUrl && asset.previewUrl) {
        existing.coverUrl = asset.previewUrl;
      }
      return;
    }

    grouped.set(key, {
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: key,
      count: 1,
      liveCount: asset.postStatus === "published" ? 1 : 0,
      coverUrl: asset.previewUrl,
      types: new Set([asset.typeLabel]),
    });
  });

  return [...grouped.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 5)
    .map((collection, index) => ({
      id: collection.id,
      label: collection.label,
      count: collection.count,
      coverUrl: collection.coverUrl || MEDIA_TYPE_META.image.fallbackPreview,
      detail: `${collection.count} asset${collection.count === 1 ? "" : "s"} • ${collection.liveCount} live`,
      tag: [...collection.types].slice(0, 2).join(" / "),
      accent: MEDIA_COLLECTION_ACCENTS[index % MEDIA_COLLECTION_ACCENTS.length],
    }));
}

function createMediaStorage(assets) {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const managedCount = assets.filter((asset) => asset.managed).length;

  return {
    totalBytes,
    usedLabel: formatFileSize(totalBytes),
    managedCount,
    linkedCount: Math.max(0, assets.length - managedCount),
    breakdown: MEDIA_TYPE_OPTIONS.filter((option) => option.key !== "all")
      .map((option) => {
        const typeAssets = assets.filter((asset) => asset.type === option.key);
        const typeBytes = typeAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);

        return {
          key: option.key,
          label: option.label,
          count: typeAssets.length,
          bytesLabel: formatFileSize(typeBytes),
          percent: totalBytes === 0 ? 0 : Math.round((typeBytes / totalBytes) * 100),
          accent: MEDIA_TYPE_META[option.key]?.accent ?? "#6f6fff",
        };
      })
      .filter((entry) => entry.count > 0),
  };
}

function createMediaActivity(assets, now) {
  return assets.slice(0, 6).map((asset) => ({
    id: `activity-${asset.id}`,
    text: `${asset.label} updated for "${asset.postTitle}"`,
    meta: `${asset.typeLabel} • ${asset.originLabel}`,
    time: formatRelativeTime(new Date(asset.updatedAt), now),
    accent: asset.accent,
  }));
}

function createPostsTableItems(posts) {
  return posts
    .filter((post) => post.createdAtDate <= new Date())
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      status: post.status,
      statusLabel: post.status === "published" ? "Published" : "Draft",
      author: post.author,
      image: post.image,
      format: post.format,
      date: formatShortDate(
        post.status === "published" && post.publishedAtDate ? post.publishedAtDate : post.updatedAtDate
      ),
      views: formatCompactNumber(post.totalViews ?? 0),
      rawViews: post.totalViews ?? 0,
      statusPriority: post.status === "published" ? 0 : 1,
      sortDate:
        post.status === "published" && post.publishedAtDate
          ? post.publishedAtDate.getTime()
          : post.updatedAtDate.getTime(),
    }))
    .sort((left, right) => {
      if (left.statusPriority !== right.statusPriority) {
        return left.statusPriority - right.statusPriority;
      }

      return right.sortDate - left.sortDate;
    });
}

export async function getDashboardOverview(search = {}, now = new Date(), currentUser = null) {
  const range = resolveRange(search, now);
  let posts = await getAllPosts();

  if (currentUser && currentUser.role !== "admin") {
    posts = posts.filter(
      (post) =>
        (post.authorEmail && post.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (!post.authorEmail && post.author && post.author.toLowerCase() === currentUser.name.toLowerCase())
    );
  }

  const events = await createDashboardEvents(posts, now, currentUser);
  const notificationEvents = await createDashboardNotificationEvents(posts, now, currentUser);

  const { focusDate, readNotificationIds = [], clearedNotificationIds = [] } = search;
  let focusRange = null;
  if (focusDate) {
    const focusParsed = parseDateInput(focusDate);
    if (focusParsed) {
      focusRange = {
        key: "custom",
        label: formatRangeLabel(focusParsed, focusParsed),
        start: startOfDay(focusParsed),
        end: endOfDay(focusParsed),
        startInput: focusDate,
        endInput: focusDate,
        days: 1,
        isCustom: true,
      };
    }
  }
  const effectiveRange = focusRange || range;

  return {
    filter: {
      key: range.key,
      label: range.label,
      startInput: range.startInput,
      endInput: range.endInput,
      isCustom: range.isCustom,
      options: RANGE_OPTIONS,
      focusDate: focusDate || null,
    },
    meta: createLastUpdatedMeta(now),
    stats: createStats(posts, effectiveRange),
    recentPosts: createRecentPosts(posts),
    trendingPosts: createTrendingPosts(posts, effectiveRange),
    activity: createActivity(events, effectiveRange, now),
    notifications: createNotifications(notificationEvents, effectiveRange, now, readNotificationIds, clearedNotificationIds),
    glance: createGlance(posts, events, effectiveRange),
    analytics: createAnalytics(posts, range),
    categoryAnalytics: createCategoryAnalytics(posts, effectiveRange),
  };
}

export async function getDashboardPosts(search = {}, now = new Date(), currentUser = null) {
  let posts = await getAllPosts();

  if (currentUser && currentUser.role !== "admin") {
    posts = posts.filter(
      (post) =>
        (post.authorEmail && post.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (!post.authorEmail && post.author && post.author.toLowerCase() === currentUser.name.toLowerCase())
    );
  }

  const events = await createDashboardEvents(posts, now, currentUser);
  const notificationEvents = await createDashboardNotificationEvents(posts, now, currentUser);
  const range = resolveRange({}, now);

  let readNotificationIds = search.readNotificationIds;
  let clearedNotificationIds = search.clearedNotificationIds;
  if (!readNotificationIds || !clearedNotificationIds) {
    try {
      const cookieStore = await cookies();
      const userSuffix = currentUser ? `_${currentUser.id || currentUser.email.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      if (!readNotificationIds) {
        const readCookie = cookieStore.get(`orin_read_notifications${userSuffix}`)?.value;
        if (readCookie) {
          try {
            readNotificationIds = JSON.parse(decodeURIComponent(readCookie));
          } catch {
            readNotificationIds = JSON.parse(readCookie);
          }
        } else {
          readNotificationIds = [];
        }
      }
      if (!clearedNotificationIds) {
        const clearedCookie = cookieStore.get(`orin_cleared_notifications${userSuffix}`)?.value;
        if (clearedCookie) {
          try {
            clearedNotificationIds = JSON.parse(decodeURIComponent(clearedCookie));
          } catch {
            clearedNotificationIds = JSON.parse(clearedCookie);
          }
        } else {
          clearedNotificationIds = [];
        }
      }
    } catch (e) {
      readNotificationIds = readNotificationIds || [];
      clearedNotificationIds = clearedNotificationIds || [];
    }
  }

  const status = normalizePostsStatus(search.status);
  const query = typeof search.query === "string" ? search.query.trim() : "";
  const tableItems = createPostsTableItems(posts);
  const filteredItems = tableItems.filter((post) => {
    const matchesStatus = status === "all" ? true : post.status === status;
    const haystack = `${post.title} ${post.category} ${post.author}`.toLowerCase();
    const matchesQuery = query ? haystack.includes(query.toLowerCase()) : true;
    return matchesStatus && matchesQuery;
  });
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const page = normalizePostsPage(search.page, totalPages);
  const pageStart = (page - 1) * pageSize;

  return {
    meta: createLastUpdatedMeta(now),
    notifications: createNotifications(notificationEvents, range, now, readNotificationIds, clearedNotificationIds),
    filters: {
      query,
      status,
      options: [
        { key: "all", label: "All posts" },
        { key: "published", label: "Published" },
        { key: "draft", label: "Drafts" },
      ],
      totals: {
        all: tableItems.length,
        published: tableItems.filter((post) => post.status === "published").length,
        draft: tableItems.filter((post) => post.status === "draft").length,
      },
    },
    items: filteredItems.slice(pageStart, pageStart + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems: filteredItems.length,
      totalPages,
      startItem: filteredItems.length === 0 ? 0 : pageStart + 1,
      endItem: Math.min(pageStart + pageSize, filteredItems.length),
    },
  };
}

export async function getDashboardMedia(search = {}, now = new Date(), currentUser = null) {
  let posts = await getAllPosts();

  if (currentUser && currentUser.role !== "admin") {
    posts = posts.filter(
      (post) =>
        (post.authorEmail && post.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (!post.authorEmail && post.author && post.author.toLowerCase() === currentUser.name.toLowerCase())
    );
  }

  const events = await createDashboardEvents(posts, now, currentUser);
  const notificationEvents = await createDashboardNotificationEvents(posts, now, currentUser);
  const range = resolveRange(search, now);

  let readNotificationIds = search.readNotificationIds;
  let clearedNotificationIds = search.clearedNotificationIds;
  if (!readNotificationIds || !clearedNotificationIds) {
    try {
      const cookieStore = await cookies();
      const userSuffix = currentUser ? `_${currentUser.id || currentUser.email.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      if (!readNotificationIds) {
        const readCookie = cookieStore.get(`orin_read_notifications${userSuffix}`)?.value;
        if (readCookie) {
          try {
            readNotificationIds = JSON.parse(decodeURIComponent(readCookie));
          } catch {
            readNotificationIds = JSON.parse(readCookie);
          }
        } else {
          readNotificationIds = [];
        }
      }
      if (!clearedNotificationIds) {
        const clearedCookie = cookieStore.get(`orin_cleared_notifications${userSuffix}`)?.value;
        if (clearedCookie) {
          try {
            clearedNotificationIds = JSON.parse(decodeURIComponent(clearedCookie));
          } catch {
            clearedNotificationIds = JSON.parse(clearedCookie);
          }
        } else {
          clearedNotificationIds = [];
        }
      }
    } catch (e) {
      readNotificationIds = readNotificationIds || [];
      clearedNotificationIds = clearedNotificationIds || [];
    }
  }

  const items = await createMediaItems(posts);
  const storage = createMediaStorage(items);

  return {
    meta: createLastUpdatedMeta(now),
    notifications: createNotifications(notificationEvents, range, now, readNotificationIds, clearedNotificationIds),
    filters: {
      active: "all",
      options: MEDIA_TYPE_OPTIONS,
      totals: MEDIA_TYPE_OPTIONS.reduce(
        (totals, option) => ({
          ...totals,
          [option.key]:
            option.key === "all"
              ? items.length
              : items.filter((asset) => asset.type === option.key).length,
        }),
        {}
      ),
    },
    stats: createMediaStats(items, storage, now),
    items,
    collections: createMediaCollections(items),
    storage,
    activity: createMediaActivity(items, now),
    notice:
      "Media in this library is attached to post entries. Open the source post to replace, remove, or re-order a file.",
    guide: [
      {
        id: "guide-post-editor",
        title: "Upload through the post editor",
        text: "New files inherit the post slug and stay connected to that entry for cleaner management later on.",
      },
      {
        id: "guide-gallery",
        title: "Keep galleries grouped",
        text: "Gallery frames remain bundled with their parent post, which makes bulk updates much easier.",
      },
      {
        id: "guide-cleanup",
        title: "Cleanup stays automatic",
        text: "When a managed upload is replaced inside a post, the dashboard can clean up the old linked asset for you.",
      },
    ],
  };
}
