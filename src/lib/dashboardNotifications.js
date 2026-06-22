import { promises as fs } from "fs";
import path from "path";

export const ACTION_NOTIFICATIONS_COOKIE = "orin_action_notifications";

const sharedNotificationsFilePath = path.join(process.cwd(), "data", "action-notifications.json");


const MAX_ACTION_NOTIFICATIONS = 50;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function sanitizeCookieSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createUserCookieName(email) {
  const key = sanitizeCookieSegment(email);
  return key ? `${ACTION_NOTIFICATIONS_COOKIE}_user_${key}` : null;
}

function createRoleCookieName(role) {
  const key = sanitizeCookieSegment(role);
  return key ? `${ACTION_NOTIFICATIONS_COOKIE}_role_${key}` : null;
}

function getCookieNamesForNotification(notification) {
  const names = [];
  const userCookieName = createUserCookieName(notification?.recipientEmail);
  const roleCookieName = createRoleCookieName(notification?.recipientRole);

  if (userCookieName) {
    names.push(userCookieName);
  }

  if (roleCookieName) {
    names.push(roleCookieName);
  }

  if (names.length === 0) {
    names.push(ACTION_NOTIFICATIONS_COOKIE);
  }

  return Array.from(new Set(names));
}

function getCookieNamesForUser(user) {
  const names = [];
  const userCookieName = createUserCookieName(user?.email);
  const roleCookieName = createRoleCookieName(user?.role);

  if (userCookieName) {
    names.push(userCookieName);
  }

  if (roleCookieName) {
    names.push(roleCookieName);
  }

  names.push(ACTION_NOTIFICATIONS_COOKIE);

  return Array.from(new Set(names));
}

function mergeNotifications(notifications) {
  const seenIds = new Set();

  return notifications.filter((item) => {
    const itemId = String(item?.id ?? "");
    if (!itemId || seenIds.has(itemId)) {
      return false;
    }

    seenIds.add(itemId);
    return true;
  });
}

function safeDecodeCookieValue(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseActionNotificationsCookie(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(safeDecodeCookieValue(value));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: String(item?.id ?? ""),
        type: String(item?.type ?? "task"),
        title: String(item?.title ?? ""),
        createdAt: String(item?.createdAt ?? ""),
        unread: item?.unread !== false,
        recipientEmail: item?.recipientEmail || null,
        recipientRole: item?.recipientRole || null,
      }))
      .filter((item) => item.id && item.title && item.createdAt)
      .slice(0, MAX_ACTION_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export function createActionNotification({ id, type = "task", title, createdAt = new Date(), recipientEmail = null, recipientRole = null }) {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const timestamp = Number.isNaN(date.getTime()) ? new Date() : date;
  const safeType = String(type || "task").toLowerCase().replace(/[^a-z0-9-]/g, "-") || "task";

  return {
    id: id || `${safeType}-${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: safeType,
    title: String(title || "Dashboard task completed"),
    createdAt: timestamp.toISOString(),
    unread: true,
    recipientEmail,
    recipientRole,
  };
}

export function toDashboardEvent(notification) {
  const createdAt = new Date(notification.createdAt);

  return {
    ...notification,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    unread: notification.unread !== false,
  };
}

export async function readActionNotificationEvents(cookieStore, currentUser = null) {
  const store = cookieStore;
  const cookieNames = getCookieNamesForUser(currentUser);
  const notifications = mergeNotifications(
    cookieNames.flatMap((cookieName) =>
      parseActionNotificationsCookie(store?.get(cookieName)?.value)
    )
  );

  return notifications.map(toDashboardEvent);
}

export async function appendActionNotificationCookie(cookieStore, notification) {
  const cookieNames = getCookieNamesForNotification(notification);

  for (const cookieName of cookieNames) {
    const current = parseActionNotificationsCookie(cookieStore.get(cookieName)?.value);
    const nextNotifications = mergeNotifications([
      notification,
      ...current,
    ]).slice(0, MAX_ACTION_NOTIFICATIONS);

    cookieStore.set(
      cookieName,
      encodeURIComponent(JSON.stringify(nextNotifications)),
      {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
      }
    );
  }
}

export async function appendSharedActionNotification(notification) {
  try {
    let notifications = [];
    try {
      const data = await fs.readFile(sharedNotificationsFilePath, "utf8");
      notifications = JSON.parse(data);
    } catch {
      notifications = [];
    }

    // Filter duplicates
    notifications = [
      notification,
      ...notifications.filter((item) => item.id !== notification.id),
    ].slice(0, 50);

    await fs.mkdir(path.dirname(sharedNotificationsFilePath), { recursive: true });
    await fs.writeFile(sharedNotificationsFilePath, JSON.stringify(notifications, null, 2), "utf8");
  } catch (err) {
    console.error("[appendSharedActionNotification] Error:", err.message);
  }
}
