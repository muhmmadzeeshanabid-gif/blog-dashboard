import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/backend/lib/userStore";
import {
  SESSION_COOKIE_NAME,
  clearUserSessions,
  createSession,
  deleteSession,
  getSession,
} from "@/backend/lib/sessionStore";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function normalizeComparableValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUserExpired(user) {
  if (!user?.expiresAt) {
    return false;
  }

  const expiry = new Date(user.expiresAt).getTime();
  return Number.isFinite(expiry) && expiry <= Date.now();
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar || "",
    bio: user.bio || "",
    password: user.password || "",
    expiresAt: user.expiresAt || null,
    joinedAt: user.joinedAt || null,
  };
}

function findMatchingUser(users, session) {
  return (
    users.find((user) => String(user.id) === String(session.userId)) ??
    null
  );
}

export async function getAuthenticatedUserFromStore(cookieStore) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await getSession(token);
  if (!session) {
    try {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        maxAge: 0,
      });
    } catch (e) {
      // Ignore Next.js read-only cookies error during page rendering
    }
    return null;
  }

  const users = await getAllUsers();
  const matchedUser = findMatchingUser(users, session);

  if (!matchedUser || matchedUser.status === "inactive" || isUserExpired(matchedUser)) {
    await deleteSession(token);
    try {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        maxAge: 0,
      });
    } catch (e) {
      // Ignore Next.js read-only cookies error during page rendering
    }
    return null;
  }

  return sanitizeUser(matchedUser);
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  return getAuthenticatedUserFromStore(cookieStore);
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();
  if (normalizeComparableValue(user.role) !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

export async function startUserSession(cookieStore, user) {
  await clearUserSessions(user.id);
  const session = await createSession(user.id);

  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return sanitizeUser(user);
}

export async function endUserSession(cookieStore) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
  });
}

export function isSameUser(actor, target) {
  return Boolean(
    actor &&
      target &&
      (
        String(actor.id) === String(target.id) ||
        normalizeComparableValue(actor.email) === normalizeComparableValue(target.email)
      )
  );
}
