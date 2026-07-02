"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/lib/authContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { user, loading, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningInEmail, setIsSigningInEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  useEffect(() => {
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

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsSigningInEmail(true);

    try {
      await signInWithEmail(email.trim(), password.trim());
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsSigningInEmail(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0d0d0f",
        backgroundImage: "radial-gradient(circle at center, #1b1b22 0%, #0d0d0f 100%)",
        padding: "20px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(20, 20, 25, 0.85)",
          borderRadius: "4px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          padding: "40px 30px",
          textAlign: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#ffffff",
            margin: "0 0 5px",
            textTransform: "uppercase",
          }}
        >
          Orin Blog
        </h1>
        <p
          style={{
            fontSize: "12px",
            color: "#9999a3",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: "0 0 30px",
          }}
        >
          Dashboard Access
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "2px",
              color: "#ff6f89",
              fontSize: "12px",
              padding: "10px 14px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} style={{ textAlign: "left", marginBottom: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "#9999a3",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              disabled={isSigningInEmail}
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
                transition: "border-color 0.2s ease",
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "var(--user-accent, var(--user-accent, #6f6fff))";
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "#9999a3",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                disabled={isSigningInEmail}
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
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(event) => {
                  event.target.style.borderColor = "var(--user-accent, var(--user-accent, #6f6fff))";
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                }}
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
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`} style={{ fontSize: "14px" }} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningInEmail}
            style={{
              width: "100%",
              height: "42px",
              backgroundColor: "var(--user-accent, var(--user-accent, #6f6fff))",
              color: "#ffffff",
              border: "none",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: isSigningInEmail ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              boxShadow: "0 4px 10px var(--user-accent-soft, var(--user-accent-soft, rgba(111, 111, 255, 0.2)))",
            }}
            onMouseEnter={(event) => {
              if (!isSigningInEmail) {
                event.currentTarget.style.backgroundColor = "#5c5cde";
                event.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(event) => {
              if (!isSigningInEmail) {
                event.currentTarget.style.backgroundColor = "var(--user-accent, var(--user-accent, #6f6fff))";
                event.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isSigningInEmail ? "Signing in..." : "Log In"}
          </button>

          <div
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.4)",
              textAlign: "center",
              lineHeight: "1.4",
            }}
          >
            Sign in with your assigned dashboard account.
          </div>
        </form>

        <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "15px" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "var(--user-accent, var(--user-accent, #6f6fff))",
              textDecoration: "underline",
              fontWeight: "500",
            }}
          >
            {"<- Back to Homepage"}
          </Link>
        </div>
      </div>
    </div>
  );
}