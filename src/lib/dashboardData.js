import { getAllPosts } from "./postStore";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_OPTIONS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "month", label: "This month" },
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
      days: Math.max(1, Math.round((endOfDay(end) - startOfDay(start)) / DAY_MS) + 1),
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
    days: Math.max(1, Math.round((preset.end - preset.start) / DAY_MS) + 1),
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

function createActivity(events, range, now) {
  const filtered = events.filter(
    (event) => event.createdAt <= range.end && event.createdAt >= range.start
  );
  const source = filtered.length > 0 ? filtered : events.filter((event) => event.createdAt <= range.end);

  return source.slice(0, 4).map((event) => ({
    id: event.id,
    text: event.title,
    time: formatRelativeTime(event.createdAt, now),
  }));
}

function createNotifications(events, range, now) {
  return events
    .filter((event) => event.createdAt <= range.end)
    .slice(0, 6)
    .map((event) => ({
      id: event.id,
      title: event.title,
      time: formatRelativeTime(event.createdAt, now),
      unread: event.unread,
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

export async function getDashboardOverview(search = {}, now = new Date()) {
  const range = resolveRange(search, now);
  const posts = await getAllPosts();
  const events = createEvents(posts, now);

  return {
    filter: {
      key: range.key,
      label: range.label,
      startInput: range.startInput,
      endInput: range.endInput,
      isCustom: range.isCustom,
      options: RANGE_OPTIONS,
    },
    meta: createLastUpdatedMeta(now),
    stats: createStats(posts, range),
    recentPosts: createRecentPosts(posts),
    trendingPosts: createTrendingPosts(posts, range),
    activity: createActivity(events, range, now),
    notifications: createNotifications(events, range, now),
    glance: createGlance(posts, events, range),
  };
}

export async function getDashboardPosts(search = {}, now = new Date()) {
  const posts = await getAllPosts();
  const events = createEvents(posts, now);
  const range = resolveRange({}, now);
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
    notifications: createNotifications(events, range, now),
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
