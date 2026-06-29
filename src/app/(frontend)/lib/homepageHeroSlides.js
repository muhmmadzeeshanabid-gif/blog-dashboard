export function formatHomepageLongDate(date) {
  if (!date) return "";

  const resolvedDate = typeof date === "string" ? new Date(date) : date;
  if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(resolvedDate);
  } catch {
    return "";
  }
}

function mapHomepagePostToHeroSlide(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title || "",
    image: post.image || "",
    author: post.author || "Admin",
    dateLabel: formatHomepageLongDate(post.publishedAtDate ?? post.updatedAtDate),
    category: post.category || "General",
    sourceType: "featured-post",
    sourceLabel: "Featured post",
  };
}

function mapHomepageCustomSlide(slide, index) {
  return {
    id: `home-slide-${index}`,
    image: slide.image || "",
    title: slide.title || "",
    author: slide.author || "Admin",
    dateLabel: slide.date || "",
    category: slide.label || "General",
    slug: slide.link || "",
    isCustomLink: true,
    sourceType: "custom-slide",
    sourceLabel: "Custom slide",
  };
}

function createComparableHeroTargets(target) {
  const value = String(target ?? "").trim();
  if (!value) {
    return [];
  }

  const normalized = value.toLowerCase();
  const targets = new Set([normalized]);
  const trimmedPath = normalized.replace(/^\/+/, "");

  if (trimmedPath) {
    targets.add(trimmedPath);
  }

  if (normalized.startsWith("/posts/")) {
    targets.add(normalized.slice("/posts/".length));
  } else if (!normalized.includes("://")) {
    targets.add(`/posts/${trimmedPath}`);
  }

  return [...targets];
}

export function resolveHomepageHeroSlides(allPosts = [], appSettings = {}) {
  const publishedPosts = allPosts.filter((post) => post.status === "published");
  const customSlides = (appSettings.homeSlides || []).map(mapHomepageCustomSlide);
  const customTargets = new Set(
    customSlides.flatMap((slide) => createComparableHeroTargets(slide.slug))
  );

  const featuredPosts = publishedPosts
    .filter((post) => post.isFeatured)
    .map(mapHomepagePostToHeroSlide)
    .filter((post) =>
      createComparableHeroTargets(post.slug).every((target) => !customTargets.has(target))
    );

  const resolvedHeroSlides = [...customSlides, ...featuredPosts];

  if (resolvedHeroSlides.length > 0) {
    return resolvedHeroSlides;
  }

  return publishedPosts.slice(0, 4).map(mapHomepagePostToHeroSlide);
}
