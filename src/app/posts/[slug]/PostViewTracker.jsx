"use client";

import { useEffect } from "react";

export default function PostViewTracker({ slug }) {
  useEffect(() => {
    if (!slug) {
      return;
    }

    fetch(`/api/posts/${slug}/view`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => undefined);
  }, [slug]);

  return null;
}
