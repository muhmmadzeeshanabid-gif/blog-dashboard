"use client";

import { useEffect } from "react";

export default function ViewTracker({ slug }) {
  useEffect(() => {
    if (!slug) return;

    const key = `viewed_${slug}`;
    const lastViewed = localStorage.getItem(key);
    const now = Date.now();

    // 24 hour cooling down period (24 * 60 * 60 * 1000)
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;

    if (!lastViewed || (now - Number(lastViewed)) > COOLDOWN_MS) {
      fetch(`/api/posts/${slug}/view`, { method: "POST" })
        .then((res) => {
          if (res.ok) {
            localStorage.setItem(key, String(now));
          }
        })
        .catch((err) => console.warn("[ViewTracker] Failed to record post view:", err));
    }
  }, [slug]);

  return null;
}
