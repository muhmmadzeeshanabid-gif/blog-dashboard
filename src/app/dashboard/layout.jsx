"use client";

import { useAuth } from "../../lib/authContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, createContext, useContext, useState } from "react";
import { NotificationsProvider } from "../../lib/notificationsContext";

// Create Context for Dashboard Settings
export const DashboardSettingsContext = createContext({
  showSidebar: true,
  sidebarPosition: "left",
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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorMsg = params.get("error_description") || hashParams.get("error_description") || params.get("error") || hashParams.get("error");
      
      if (errorMsg) {
        console.warn("[Auth] Redirect error detected:", errorMsg);
        router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
        return;
      }
    }

    const isCallback = typeof window !== "undefined" && (
      window.location.hash.includes("access_token=") ||
      window.location.search.includes("code=")
    );
    if (!loading && !user && !isCallback) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0d0e12",
        color: "#ffffff",
        fontFamily: "Poppins, sans-serif",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Glowing radial background decoration */}
        <div style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(111,111,255,0.12) 0%, rgba(0,0,0,0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1
        }} />

        <div style={{ textAlign: "center", zIndex: 2, position: "relative" }}>
          {/* Glowing Multi-Ring Orb */}
          <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 28px" }}>
            {/* Outer Ring */}
            <div style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              border: "2.5px solid transparent",
              borderTopColor: "#6f6fff",
              borderBottomColor: "#6f6fff",
              borderRadius: "50%",
              animation: "spinOuter 1.4s cubic-bezier(0.68, -0.45, 0.27, 1.45) infinite"
            }} />
            {/* Inner Ring */}
            <div style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "10px",
              bottom: "10px",
              border: "2px solid transparent",
              borderLeftColor: "#ff6b8b",
              borderRightColor: "#ff6b8b",
              borderRadius: "50%",
              animation: "spinInner 1.1s ease-in-out infinite reverse"
            }} />
            {/* Center glowing pulsing dot */}
            <div style={{
              position: "absolute",
              top: "28px",
              left: "28px",
              width: "24px",
              height: "24px",
              background: "#6f6fff",
              borderRadius: "50%",
              boxShadow: "0 0 16px #6f6fff",
              animation: "pulse 1.3s ease-in-out infinite"
            }} />
          </div>

          {/* Shimmering Text Header */}
          <h2 style={{
            fontSize: "18px",
            fontWeight: "700",
            letterSpacing: "2.5px",
            marginBottom: "8px",
            background: "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.3) 50%, #ffffff 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 2.2s linear infinite"
          }}>
            ORIN DASHBOARD
          </h2>
          <p style={{ fontSize: "12px", opacity: 0.55, letterSpacing: "1px", fontWeight: "400" }}>
            Preparing environment...
          </p>
        </div>

        <style>{`
          @keyframes spinOuter {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes spinInner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(0.85); opacity: 0.55; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: 0% center; }
            100% { background-position: -200% center; }
          }
        `}</style>
      </div>
    );
  }

  // If user is not loaded yet, block rendering to prevent layout flashes
  if (!user) {
    return null;
  }

  // Protect Admin-only pages
  if (user.role !== "admin" && (pathname === "/dashboard/categories" || pathname === "/dashboard/analytics" || pathname === "/dashboard/users")) {
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
      const { getAccentCookie, applyAccent } = require("../../lib/accentTheme");
      
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
        <DashboardSettingsContext.Provider value={{ showSidebar, sidebarPosition, updateDashboardSettings }}>
          {children}
        </DashboardSettingsContext.Provider>
      </NotificationsProvider>
    </DashboardAuthWrapper>
  );
}
