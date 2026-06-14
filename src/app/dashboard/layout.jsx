"use client";

import { useAuth } from "../../lib/authContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

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
        backgroundColor: "#121214",
        color: "#ffffff",
        fontFamily: "Poppins, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTop: "3px solid #6f6fff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 15px"
          }} />
          <p style={{ fontSize: "14px", fontWeight: "500", opacity: 0.8 }}>Loading dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
  if (user.role !== "admin" && (pathname === "/dashboard/categories" || pathname === "/dashboard/analytics")) {
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
  return (
    <DashboardAuthWrapper>
      {children}
    </DashboardAuthWrapper>
  );
}
