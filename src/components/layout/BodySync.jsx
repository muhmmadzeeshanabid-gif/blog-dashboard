"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BodySync({ isDarkInitial }) {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboardOrLogin = pathname.startsWith("/dashboard") || pathname.startsWith("/login");
    
    // Check if body already has the dark style class
    const isDark = document.body.classList.contains("bwp-dark-style") || isDarkInitial;

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

    // Apply styles to document body
    if (isDashboardOrLogin) {
      document.body.style.backgroundColor = isDarkDashboardOrLogin ? "#0d0d0f" : "#f7f8fb";
      document.body.style.paddingTop = "0";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.paddingTop = "";
    }
  }, [pathname, isDarkInitial]);

  return null;
}
