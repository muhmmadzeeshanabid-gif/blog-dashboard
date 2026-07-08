/**
 * Shared utility functions used across backend and frontend.
 * Centralised here to avoid duplication across modules.
 */

/**
 * Converts a string to Title Case.
 * e.g. "hello world" → "Hello World"
 */
export function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Pads a number to at least 2 digits with a leading zero.
 * e.g. 5 → "05"
 */
export function pad(num) {
  return String(num).padStart(2, "0");
}

/**
 * Returns a YYYY-MM-DD date key string from a Date object.
 */
export function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Converts a string to a URL-safe slug.
 * e.g. "Hello World!" → "hello-world"
 */
export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolves an avatar source, redirecting Pinterest URLs to a backend image scraper.
 */
export function resolveAvatarSrc(src) {
  if (!src) return "";
  const trimmed = String(src).trim();
  if (trimmed.includes("pinterest.com/pin/") || trimmed.includes("pin.it/")) {
    return `/api/resolve-image?url=${encodeURIComponent(trimmed)}`;
  }
  if (trimmed.startsWith("/images/") && trimmed.includes("-unsplash")) {
    return `/api/resolve-image?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function resolveImageSrc(src) {
  if (!src) return "";
  const trimmed = String(src).trim();
  if (trimmed.includes("pinterest.com/pin/") || trimmed.includes("pin.it/")) {
    return `/api/resolve-image?url=${encodeURIComponent(trimmed)}`;
  }
  if (trimmed.startsWith("/images/") && trimmed.includes("-unsplash")) {
    return `/api/resolve-image?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

