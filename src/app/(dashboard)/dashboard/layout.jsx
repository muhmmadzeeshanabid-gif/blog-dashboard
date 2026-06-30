"use client";

import { useAuth } from "@/frontend/lib/authContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, createContext, useContext, useState } from "react";
import { NotificationsProvider } from "@/dashboard/lib/notificationsContext";

// Create Context for Dashboard Settings
export const DashboardSettingsContext = createContext({
  showSidebar: true,
  sidebarPosition: "left",
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
  mounted: false,
  updateDashboardSettings: () => {},
});

export function useDashboardSettings() {
  return useContext(DashboardSettingsContext);
}

function DashboardAuthWrapper({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorMsg = params.get("error_description") || hashParams.get("error_description") || params.get("error") || hashParams.get("error");
      
      if (errorMsg) {
        console.warn("[Auth] Redirect error detected:", errorMsg);
        setTimeout(() => {
          if (active) router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
        }, 0);
        return;
      }
    }

    const isCallback = typeof window !== "undefined" && (
      window.location.hash.includes("access_token=") ||
      window.location.search.includes("code=")
    );
    if (!loading && !user && !isCallback) {
      setTimeout(() => {
        if (active) router.replace("/login");
      }, 0);
    }

    return () => {
      active = false;
    };
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  // If user is not loaded yet, block rendering to prevent layout flashes
  if (!user) {
    return null;
  }

  // Protect Admin-only pages
  if (user.role !== "admin" && (pathname === "/dashboard/categories" || pathname === "/dashboard/analytics" || pathname === "/dashboard/users" || pathname === "/dashboard/highlights" || pathname === "/dashboard/messages" || pathname === "/dashboard/team")) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#121214",
        color: "#ffffff",
        fontFamily: "Poppins, sans-serif",
        padding: "20px"
      }}>
        <div style={{ textAlign: "center", maxWidth: "450px" }}>
          <i className="fas fa-lock" style={{ fontSize: "48px", color: "#ff6f89", marginBottom: "20px" }}></i>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>Access Denied</h2>
          <p style={{ fontSize: "14px", opacity: 0.7, lineHeight: "1.5", marginBottom: "20px" }}>
            This page is restricted to Admin users only. Your account role is <strong>{user.role}</strong>.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6f6fff",
              border: "none",
              borderRadius: "2px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState("left");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsSidebarCollapsed(window.innerWidth < 992);
    }
  }, []);

  useEffect(() => {
    // Fetch initial settings
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/dashboard/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setShowSidebar(data.settings.showSidebar !== false);
            setSidebarPosition(data.settings.sidebarPosition === "right" ? "right" : "left");
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const updateDashboardSettings = (nextSettings) => {
    if (nextSettings.showSidebar !== undefined) {
      setShowSidebar(nextSettings.showSidebar);
    }
    if (nextSettings.sidebarPosition !== undefined) {
      setSidebarPosition(nextSettings.sidebarPosition);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { getAccentCookie, applyAccent } = require("@/frontend/lib/accentTheme");
      
      const currentAccent = getAccentCookie();
      applyAccent(currentAccent);

      // Listen to dynamic accent changes
      const handleAccentChange = (e) => {
        const nextAccent = e.detail?.accent || getAccentCookie();
        applyAccent(nextAccent);
      };
      window.addEventListener("orin-accent-changed", handleAccentChange);

      // Observe body class changes to automatically update colors when dark/light mode toggles
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === "class") {
            const nextAccent = getAccentCookie();
            applyAccent(nextAccent);
          }
        }
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
      });

      return () => {
        window.removeEventListener("orin-accent-changed", handleAccentChange);
        observer.disconnect();
      };
    }
  }, []);

  return (
    <DashboardAuthWrapper>
      <NotificationsProvider>
        <DashboardSettingsContext.Provider value={{
          showSidebar,
          sidebarPosition,
          isSidebarCollapsed,
          setIsSidebarCollapsed,
          mounted,
          updateDashboardSettings
        }}>
          {children}
        </DashboardSettingsContext.Provider>
      </NotificationsProvider>
    </DashboardAuthWrapper>
  );
}
