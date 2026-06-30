"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => { },
  signInWithEmail: async (email, password) => { },
  loginWithMock: (role, customName, customUser) => { },
  logout: async () => { },
  updateProfile: (newName, newAvatar, newBio) => { },
});

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + "=; Max-Age=-99999999; path=/";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const determineRole = (email) => {
    if (!email) return "editor";
    const lower = email.toLowerCase();
    // Only admin@orin.com gets admin initially; others will be synced from database
    if (lower === "admin@orin.com") {
      return "admin";
    }
    return "editor";
  };



  useEffect(() => {
    let active = true;
    let initialCheckFinished = false;

    const checkSession = async () => {
      console.log("[Auth] Starting session check. isSupabaseConfigured:", isSupabaseConfigured);

      // Check if session has expired (older than 2 days)
      if (typeof window !== "undefined") {
        const sessionCreatedAt = localStorage.getItem("orin_session_created_at");
        if (sessionCreatedAt) {
          const elapsed = Date.now() - parseInt(sessionCreatedAt, 10);
          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
          if (elapsed > twoDaysMs) {
            console.log("[Auth] Session expired (older than 2 days). Clearing session...");
            localStorage.removeItem("orin_session_created_at");
            localStorage.removeItem("orin_user_session");
            eraseCookie("orin_session_created_at");
            eraseCookie("orin_user_session");
            if (isSupabaseConfigured) {
              try {
                await supabase.auth.signOut();
              } catch (err) {}
            }
            setUser(null);
            setLoading(false);
            return;
          }
        }
      }

      let sessionUser = null;

      // Check if we are returning from an OAuth flow (hash contains tokens or query string has pkce code)
      const isCallback = typeof window !== "undefined" && (
        window.location.hash.includes("access_token=") ||
        window.location.search.includes("code=")
      );

      // 1. If Supabase is configured, check live session first
      if (isSupabaseConfigured) {
        try {
          if (isCallback) {
            console.log("[Auth] OAuth callback detected, waiting 1.5s for token processing...");
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          console.log("[Auth] Supabase is configured. Querying live session...");
          const { data: { session } } = await supabase.auth.getSession();
          console.log("[Auth] Live session retrieved:", session ? "User found" : "No active session");

          if (session?.user) {
            const userEmail = session.user.email;
            const userMetadata = session.user.user_metadata || {};
            sessionUser = {
              id: session.user.id,
              email: userEmail,
              role: determineRole(userEmail),
              name: userMetadata.full_name || userMetadata.name || userEmail.split("@")[0],
              avatar: userMetadata.avatar_url !== undefined
                ? (userMetadata.avatar_url ?? "")
                : (userMetadata.picture !== undefined
                  ? (userMetadata.picture ?? "")
                  : "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=400&d=404"),
              provider: "google",
              joinedAt: session.user.created_at || new Date().toISOString(),
            };
          }
        } catch (err) {
          console.warn("[Auth] Supabase session check failed:", err.message || err);
        }
      }

      // 2. Check stored session fallback (for mock user recovery)
      if (!sessionUser) {
        const storedSessionStr = getCookie("orin_user_session") || (typeof window !== "undefined" ? localStorage.getItem("orin_user_session") : null);
        if (storedSessionStr) {
          try {
            const parsed = JSON.parse(storedSessionStr);
            if (parsed) {
              sessionUser = parsed;
              console.log("[Auth] Restored session user:", parsed.name);
            }
          } catch (e) {
            console.error("[Auth] Error parsing stored session:", e);
            eraseCookie("orin_user_session");
          }
        }
      }

      if (active) {
        setUser((prev) => {
          // If we already have a live Google session set by onAuthStateChange, don't overwrite it with null
          if (prev && prev.provider === "google" && !sessionUser) {
            return prev;
          }
          return sessionUser;
        });
        initialCheckFinished = true;
        setLoading(false);
      }
    };

    checkSession();

    // 3. Listen to Supabase auth state changes only if configured
    let subscription = null;
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("[Auth] onAuthStateChange event fired:", _event);
          if (!active) return;

          if (session?.user) {
            const userEmail = session.user.email;
            const userMetadata = session.user.user_metadata || {};
            setUser({
              id: session.user.id,
              email: userEmail,
              role: determineRole(userEmail),
              name: userMetadata.full_name || userMetadata.name || userEmail.split("@")[0],
              avatar: userMetadata.avatar_url !== undefined
                ? (userMetadata.avatar_url ?? "")
                : (userMetadata.picture !== undefined
                  ? (userMetadata.picture ?? "")
                  : "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=400&d=404"),
              provider: "google",
              joinedAt: session.user.created_at || new Date().toISOString(),
            });
            initialCheckFinished = true;
            setLoading(false);
          } else {
            // Keep mock user if one is active, otherwise set null
            const storedSessionStr = getCookie("orin_user_session") || (typeof window !== "undefined" ? localStorage.getItem("orin_user_session") : null);
            let hasMock = false;
            if (storedSessionStr) {
              try {
                const parsed = JSON.parse(storedSessionStr);
                if (parsed && parsed.provider === "mock") {
                  hasMock = true;
                }
              } catch { }
            }
            if (!hasMock) {
              setUser((prev) => {
                // If we already have a Google user set, do not reset it to null from onAuthStateChange
                // unless we are explicitly signed out (event is SIGNED_OUT). This handles the initial
                // transient null session state during OAuth callback parsing.
                if (prev && prev.provider === "google" && _event !== "SIGNED_OUT") {
                  return prev;
                }
                return null;
              });

              // Only set loading to false if we are not in an active OAuth callback
              const isCallback = typeof window !== "undefined" && (
                window.location.hash.includes("access_token=") ||
                window.location.search.includes("code=")
              );
              if (!isCallback) {
                if (initialCheckFinished || _event === "SIGNED_OUT") {
                  setLoading(false);
                }
              }
            }
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.error("[Auth] Error registering onAuthStateChange:", err);
      }
    }

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Keep cookies and localStorage synchronized with the user state
  useEffect(() => {
    if (loading) return; // Wait until initial session restore finishes

    if (user) {
      setCookie("orin_user_session", JSON.stringify(user), 7);
      if (typeof window !== "undefined") {
        localStorage.setItem("orin_user_session", JSON.stringify(user));
        
        // Initialize session creation timestamp if not set
        if (!localStorage.getItem("orin_session_created_at")) {
          localStorage.setItem("orin_session_created_at", Date.now().toString());
          setCookie("orin_session_created_at", Date.now().toString(), 2);
        }
      }

      // Sync user profile to backend database/users.json
      fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio || "",
          expiresAt: user.expiresAt || null,
        }),
      })
      .then(async (res) => {
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          console.warn("[Auth] Access denied:", data.error);
          logout().then(() => {
            if (typeof window !== "undefined") {
              const reason = data.status === "expired" ? "Admin revoked your access." : (data.status === "deactivated" ? "Your account has been deactivated." : "Access denied. Your email is not registered.");
              window.location.href = `/login?error=${encodeURIComponent(reason)}`;
            }
          });
          return;
        }

        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data?.user) {
          // Sync any database updates (role changes, avatar, name, email, etc.) back to active context
          setUser((prev) => {
            if (!prev) return null;
            if (
              prev.role !== data.user.role ||
              prev.name !== data.user.name ||
              prev.avatar !== data.user.avatar ||
              prev.bio !== data.user.bio ||
              prev.expiresAt !== data.user.expiresAt ||
              prev.email !== data.user.email
            ) {
              return {
                ...prev,
                name: data.user.name,
                avatar: data.user.avatar,
                role: data.user.role,
                bio: data.user.bio,
                expiresAt: data.user.expiresAt,
                email: data.user.email,
              };
            }
            return prev;
          });
        }
      })
      .catch((err) => console.warn("[Auth] Sync failed:", err));
    } else {
      eraseCookie("orin_user_session");
      if (typeof window !== "undefined") {
        localStorage.removeItem("orin_user_session");
      }
    }
  }, [user, loading]);

  // Periodic and startup session expiration check (2 days auto-logout and access expiry)
  useEffect(() => {
    if (!user) return;

    const checkSessionExpiry = () => {
      // 1. Check local session expiry (2 days)
      if (typeof window !== "undefined") {
        const sessionCreatedAt = localStorage.getItem("orin_session_created_at");
        if (sessionCreatedAt) {
          const elapsed = Date.now() - parseInt(sessionCreatedAt, 10);
          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
          if (elapsed > twoDaysMs) {
            console.log("[Auth] Session expired (older than 2 days). Forced logout.");
            logout().then(() => {
              window.location.href = "/login?error=Session expired. Please log in again.";
            });
            return;
          }
        }
      }

      // 2. Check local expiresAt if available
      if (user?.expiresAt) {
        const expiry = new Date(user.expiresAt);
        if (expiry < new Date()) {
          console.log("[Auth] Session expired via expiresAt. Forced logout.");
          logout().then(() => {
            window.location.href = "/login?error=" + encodeURIComponent("Admin revoked your access.");
          });
          return;
        }
      }

      // 3. Periodic live check of database status via sync API
      fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio || "",
          expiresAt: user.expiresAt || null,
        }),
      })
      .then(async (res) => {
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          console.warn("[Auth] Periodic check: Access denied:", data.error);
          logout().then(() => {
            if (typeof window !== "undefined") {
              const reason = data.status === "expired" ? "Admin revoked your access." : (data.status === "deactivated" ? "Your account has been deactivated." : "Access denied. Your email is not registered.");
              window.location.href = `/login?error=${encodeURIComponent(reason)}`;
            }
          });
        } else if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.user) {
            setUser((prev) => {
              if (!prev) return null;
              if (
                prev.role !== data.user.role ||
                prev.name !== data.user.name ||
                prev.avatar !== data.user.avatar ||
                prev.bio !== data.user.bio ||
                prev.expiresAt !== data.user.expiresAt
              ) {
                return {
                  ...prev,
                  name: data.user.name,
                  avatar: data.user.avatar,
                  role: data.user.role,
                  bio: data.user.bio,
                  expiresAt: data.user.expiresAt,
                };
              }
              return prev;
            });
          }
        }
      })
      .catch((err) => console.warn("[Auth] Periodic sync check failed:", err));
    };

    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  const signInWithGoogle = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      throw new Error("Google Sign-in is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file to enable live authentication.");
    }
    const redirectToUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectToUrl,
      },
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      throw new Error("Supabase is not configured. Please add your credentials to the .env.local file.");
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithMock = (role, customName = "", customUser = null) => {
    setLoading(true);
    if (customUser) {
      setUser(customUser);
    } else {
      const displayName = customName.trim() || (role === "admin" ? "Orin Admin" : "Orin Editor");
      const mockUser = role === "admin"
        ? {
          id: "mock-admin-id",
          email: "admin@orin.com",
          role: "admin",
          name: displayName,
          avatar: "https://secure.gravatar.com/avatar/602f3bb4e42cc75168bc6a987cf48ca3?s=400&d=mm&r=g",
          bio: "Developer of WordPress themes and writer of minimalist stories.",
          provider: "mock",
          joinedAt: new Date().toISOString(),
        }
        : {
          id: "mock-user-id",
          email: "author@orin.com",
          role: "editor",
          name: displayName,
          avatar: "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=400&d=404",
          provider: "mock",
          joinedAt: new Date().toISOString(),
        };

      setUser(mockUser);
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("orin_session_created_at");
      localStorage.removeItem("orin_user_session");
    }
    eraseCookie("orin_session_created_at");
    eraseCookie("orin_user_session");
    setLoading(false);
  };

  const updateProfile = async (newName, newAvatar, newBio, newEmail) => {
    if (!user) return;

    if (isSupabaseConfigured && user.provider !== "mock") {
      try {
        const updateData = {};
        if (newName !== undefined) updateData.full_name = newName;
        if (newName !== undefined) updateData.name = newName;
        if (newAvatar !== undefined) updateData.avatar_url = newAvatar;
        if (newAvatar !== undefined) updateData.picture = newAvatar;
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase.auth.updateUser({
            data: updateData
          });
          if (error) {
            console.error("[Auth] Failed to update Supabase user metadata:", error.message);
          } else {
            console.log("[Auth] Supabase user metadata updated successfully");
          }
        }

        if (newEmail !== undefined && newEmail.toLowerCase() !== user.email.toLowerCase()) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: newEmail
          });
          if (emailError) {
            console.error("[Auth] Failed to update Supabase user email:", emailError.message);
          } else {
            console.log("[Auth] Supabase user email update initiated successfully");
          }
        }
      } catch (err) {
        console.error("[Auth] Supabase profile update error:", err);
      }
    }

    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      if (newName !== undefined) updated.name = newName;
      if (newAvatar !== undefined) updated.avatar = newAvatar;
      if (newBio !== undefined) updated.bio = newBio;
      if (newEmail !== undefined) updated.email = newEmail;
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, loginWithMock, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
