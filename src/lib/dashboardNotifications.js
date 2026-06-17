export const ACTION_NOTIFICATIONS_COOKIE = "orin_action_notifications";

const MAX_ACTION_NOTIFICATIONS = 20;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

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
      }))
      .filter((item) => item.id && item.title && item.createdAt)
      .slice(0, MAX_ACTION_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export function createActionNotification({ id, type = "task", title, createdAt = new Date() }) {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const timestamp = Number.isNaN(date.getTime()) ? new Date() : date;
  const safeType = String(type || "task").toLowerCase().replace(/[^a-z0-9-]/g, "-") || "task";

  return {
    id: id || `${safeType}-${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: safeType,
    title: String(title || "Dashboard task completed"),
    createdAt: timestamp.toISOString(),
    unread: true,
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

export async function readActionNotificationEvents(cookieStore) {
  const store = cookieStore;
  const rawValue = store?.get(ACTION_NOTIFICATIONS_COOKIE)?.value;
  return parseActionNotificationsCookie(rawValue).map(toDashboardEvent);
}

export async function appendActionNotificationCookie(cookieStore, notification) {
  const current = parseActionNotificationsCookie(cookieStore.get(ACTION_NOTIFICATIONS_COOKIE)?.value);
  const nextNotifications = [
    notification,
    ...current.filter((item) => item.id !== notification.id),
  ].slice(0, MAX_ACTION_NOTIFICATIONS);

  cookieStore.set(
    ACTION_NOTIFICATIONS_COOKIE,
    encodeURIComponent(JSON.stringify(nextNotifications)),
    {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    }
  );
}
