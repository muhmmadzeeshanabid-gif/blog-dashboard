"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, loginWithMock } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInEmail, setIsSigningInEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }
  }, []);


  useEffect(() => {
    // Reset body style for clean fullscreen login view
    const originalClassName = document.body.className;
    const originalStyle = document.body.getAttribute("style");

    document.body.className = "bwp-clean-login-body";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#0d0d0f";
    document.body.style.top = "0";
    document.body.style.marginTop = "0";

    return () => {
      document.body.className = originalClassName;
      if (originalStyle) {
        document.body.setAttribute("style", originalStyle);
      } else {
        document.body.removeAttribute("style");
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Failed to initialize Google login.");
      setIsSigningIn(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsSigningInEmail(true);

    const enteredEmail = email.trim().toLowerCase();
    const enteredPassword = password.trim();

    // Mock Admin bypass for testing/development
    if (enteredEmail === "admin@orin.com" && enteredPassword === "admin") {
      try {
        loginWithMock("admin");
        router.replace("/dashboard");
        return;
      } catch (err) {
        setError("Failed mock admin login.");
        setIsSigningInEmail(false);
        return;
      }
    }

    try {
      await signInWithEmail(email.trim(), password.trim());
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setIsSigningInEmail(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#0d0d0f",
      backgroundImage: "radial-gradient(circle at center, #1b1b22 0%, #0d0d0f 100%)",
      padding: "20px",
      fontFamily: "Poppins, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "rgba(20, 20, 25, 0.85)",
        borderRadius: "4px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
        padding: "40px 30px",
        textAlign: "center",
        backdropFilter: "blur(8px)"
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: "24px",
          fontWeight: "800",
          letterSpacing: "1px",
          color: "#ffffff",
          margin: "0 0 5px",
          textTransform: "uppercase"
        }}>
          Orin Blog
        </h1>
        <p style={{
          fontSize: "12px",
          color: "#9999a3",
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "2px",
          margin: "0 0 30px"
        }}>
          Dashboard Access
        </p>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "2px",
            color: "#ff6f89",
            fontSize: "12px",
            padding: "10px 14px",
            marginBottom: "20px",
            textAlign: "left"
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
            {error}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} style={{ textAlign: "left", marginBottom: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "#9999a3",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isSigningIn || isSigningInEmail}
              style={{
                width: "100%",
                height: "42px",
                backgroundColor: "#16161a",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "2px",
                color: "#ffffff",
                padding: "0 14px",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--user-accent, var(--user-accent, #6f6fff))"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "#9999a3",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSigningIn || isSigningInEmail}
                style={{
                  width: "100%",
                  height: "42px",
                  backgroundColor: "#16161a",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "2px",
                  color: "#ffffff",
                  padding: "0 40px 0 14px",
                  fontSize: "13px",
                  outline: "none",
                  transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--user-accent, var(--user-accent, #6f6fff))"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`} style={{ fontSize: "14px" }} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningIn || isSigningInEmail}
            style={{
              width: "100%",
              height: "42px",
              backgroundColor: "var(--user-accent, var(--user-accent, #6f6fff))",
              color: "#ffffff",
              border: "none",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: (isSigningIn || isSigningInEmail) ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              boxShadow: "0 4px 10px var(--user-accent-soft, var(--user-accent-soft, rgba(111, 111, 255, 0.2)))"
            }}
            onMouseEnter={(e) => {
              if (!isSigningIn && !isSigningInEmail) {
                e.currentTarget.style.backgroundColor = "#5c5cde";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSigningIn && !isSigningInEmail) {
                e.currentTarget.style.backgroundColor = "var(--user-accent, var(--user-accent, #6f6fff))";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isSigningInEmail ? "Signing in..." : "Log In"}
          </button>

          {isSupabaseConfigured ? (
            <div style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.4)",
              textAlign: "center",
              lineHeight: "1.4"
            }}>
              Supabase authentication is <span style={{ color: "#4ade80", fontWeight: "600" }}>active</span>.<br />
              Please sign in using your Supabase credentials.
            </div>
          ) : (
            <div style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.4)",
              textAlign: "center",
              lineHeight: "1.4"
            }}>
              <span style={{ color: "var(--user-accent, var(--user-accent, #6f6fff))" }}>Admin Test Credentials (Mock):</span><br />
              Email: <strong>admin@orin.com</strong> | Password: <strong>admin</strong>
            </div>
          )}
        </form>

        {/* Separator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "25px 0 20px",
          color: "rgba(255, 255, 255, 0.2)",
          fontSize: "10px",
          fontWeight: "600",
          letterSpacing: "1.5px"
        }}>
          <span style={{ flex: 1, height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />
          <span style={{ padding: "0 10px", textTransform: "uppercase" }}>or</span>
          <span style={{ flex: 1, height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />
        </div>

        {/* Live Google Auth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSigningIn || isSigningInEmail}
          style={{
            width: "100%",
            height: "46px",
            backgroundColor: "#ffffff",
            color: "#121214",
            border: "none",
            borderRadius: "2px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: (isSigningIn || isSigningInEmail) ? "not-allowed" : "pointer",
            transition: "all 0.25s ease",
            boxShadow: "0 4px 12px rgba(255,255,255,0.05)",
            outline: "none"
          }}
          onMouseEnter={(e) => {
            if (!isSigningIn && !isSigningInEmail) {
              e.currentTarget.style.backgroundColor = "#f0f0f5";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSigningIn && !isSigningInEmail) {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          <i className="fab fa-google" style={{ fontSize: "16px", color: "#4285F4" }}></i>
          {isSigningIn ? "Redirecting to Google..." : "Continue with Google"}
        </button>

        <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "15px" }}>
          <Link href="/" style={{
            fontSize: "12px",
            color: "var(--user-accent, var(--user-accent, #6f6fff))",
            textDecoration: "underline",
            fontWeight: "500"
          }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>

    </div>
  );
}
