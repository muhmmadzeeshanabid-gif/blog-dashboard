"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getErrorMessage(payload, fallbackMessage) {
  return String(payload?.error || fallbackMessage);
}

export function AuthProvider({ children, initialUser = undefined }) {
  const [user, setUser] = useState(initialUser === undefined ? null : initialUser);
  const [loading, setLoading] = useState(initialUser === undefined ? true : false);

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/users/session", {
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const payload = await parseJson(response);
      const nextUser = payload?.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      console.warn("[Auth] Session refresh failed:", error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      // If we already received initialUser from server-side rendering, skip fetching initially
      if (initialUser !== undefined) {
        return;
      }

      try {
        const response = await fetch("/api/users/session", {
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const payload = await parseJson(response);
        if (active) {
          setUser(payload?.user ?? null);
        }
      } catch (error) {
        console.warn("[Auth] Initial session load failed:", error);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  const signInWithGoogle = async () => {
    throw new Error("Google sign-in is currently unavailable for this dashboard.");
  };

  const signInWithEmail = async (email, password) => {
    setLoading(true);

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(email ?? "").trim(),
          password: String(password ?? ""),
        }),
      });

      const payload = await parseJson(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Invalid email or password."));
      }

      setUser(payload?.user ?? null);
      return payload?.user ?? null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await fetch("/api/users/logout", {
        method: "POST",
      });
    } catch (error) {
      console.warn("[Auth] Logout request failed:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (newName, newAvatar, newBio, newEmail) => {
    const response = await fetch("/api/users/session", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newName,
        avatar: newAvatar,
        bio: newBio,
        email: newEmail,
      }),
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, "Failed to update profile."));
    }

    setUser(payload?.user ?? null);
    return payload?.user ?? null;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithEmail, logout, updateProfile, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}