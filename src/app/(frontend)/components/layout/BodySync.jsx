"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BodySync() {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboardOrLogin = pathname.startsWith("/dashboard") || pathname.startsWith("/login");
    
    // Check current cookie value on the client to avoid stale server-rendered theme state
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const cookieTheme = match ? decodeURIComponent(match[1]) : "";
    const isDark = cookieTheme === "dark";

    let classes = ["home", "blog", "wp-embed-responsive", "wp-theme-orin", "bwp-body", "bwp-sidebar-hidden"];
    if (!isDashboardOrLogin) {
      classes.push("bwp-enable-sticky-header");
    }
    const isDarkDashboardOrLogin = isDark || pathname.startsWith("/login");
    if (isDarkDashboardOrLogin) {
      classes.push("bwp-dark-style");
    }

    // Apply classes to document body
    document.body.className = classes.join(" ");

    // Set data-page attribute so CSS can distinguish dashboard vs frontend
    document.body.setAttribute("data-page", isDashboardOrLogin ? "dashboard" : "frontend");

    // Apply styles to document body — use consistent dark bg color matching layout.jsx
    if (isDashboardOrLogin) {
      document.body.style.backgroundColor = isDarkDashboardOrLogin ? "#1a1a1e" : "#ffffff";
      document.body.style.paddingTop = "0";
      document.body.style.overflowX = "";
      document.body.style.overflow = "";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.paddingTop = "";
      document.body.style.overflowX = "";
      document.body.style.overflow = "";
    }

    // Track analytics (page views and unique visitors) on public routes
    if (!isDashboardOrLogin && !pathname.startsWith("/api")) {
      try {
        const todayKey = new Date().toISOString().split("T")[0];
        const lastVisitedDate = localStorage.getItem("site_last_visited_date");
        const isNewVisitor = lastVisitedDate !== todayKey;

        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pathname, isNewVisitor })
        })
          .then(res => {
            if (res.ok) {
              localStorage.setItem("site_last_visited_date", todayKey);
            }
          })
          .catch(err => console.warn("[Analytics Tracker] Failed to log visit:", err));
      } catch (e) {
        // ignore storage access errors
      }
    }
  }, [pathname]);

  return null;
}
