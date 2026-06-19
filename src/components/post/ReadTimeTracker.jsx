"use client";

import { useEffect, useRef } from "react";

export default function ReadTimeTracker({ slug }) {
  const activeSecondsRef = useRef(0);
  const hasSentHeartbeatRef = useRef(false);
  const lastActivityTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!slug) return;

    // Reset references for a new slug
    activeSecondsRef.current = 0;
    hasSentHeartbeatRef.current = false;
    lastActivityTimeRef.current = Date.now();

    // User activity listeners
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Send heartbeat helper
    const sendHeartbeat = (seconds, isNewSession) => {
      fetch("/api/posts/read-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, seconds, isNewSession }),
      }).catch((err) => {
        console.warn("[ReadTimeTracker] Failed to send read time:", err);
      });
    };

    // Flush any pending seconds on exit
    const flushReadTime = () => {
      const secs = activeSecondsRef.current;
      if (secs < 2) return;

      const isNew = !hasSentHeartbeatRef.current;
      
      // Reset immediately to prevent double sends
      activeSecondsRef.current = 0;
      hasSentHeartbeatRef.current = true;

      fetch("/api/posts/read-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, seconds: secs, isNewSession: isNew }),
        keepalive: true,
      }).catch(() => {});
    };

    // Page state change handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushReadTime();
      }
    };

    const handlePageHide = () => {
      flushReadTime();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    // Main 1-second ticking interval
    const intervalId = setInterval(() => {
      const isVisible = document.visibilityState === "visible";
      const isFocused = document.hasFocus();
      const isNotIdle = Date.now() - lastActivityTimeRef.current < 30000; // 30s idle timeout

      if (isVisible && isFocused && isNotIdle) {
        activeSecondsRef.current += 1;

        // Trigger initial sync after 5s active reading to count the session
        if (!hasSentHeartbeatRef.current && activeSecondsRef.current >= 5) {
          const secs = activeSecondsRef.current;
          activeSecondsRef.current = 0;
          hasSentHeartbeatRef.current = true;
          sendHeartbeat(secs, true);
        }
        // Subsequent heartbeat syncs every 15s
        else if (hasSentHeartbeatRef.current && activeSecondsRef.current >= 15) {
          const secs = activeSecondsRef.current;
          activeSecondsRef.current = 0;
          sendHeartbeat(secs, false);
        }
      }
    }, 1000);

    return () => {
      // Clean up event listeners
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);

      // Flush remaining seconds and clear interval
      flushReadTime();
      clearInterval(intervalId);
    };
  }, [slug]);

  return null;
}
