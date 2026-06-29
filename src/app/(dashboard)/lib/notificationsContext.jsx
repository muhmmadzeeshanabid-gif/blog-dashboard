"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/frontend/lib/authContext";

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: (id) => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  refresh: async () => {},
});

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userSuffix = user ? `_${user.id || user.email.replace(/[^a-zA-Z0-9]/g, "_")}` : "";

  // Helper to read a JSON cookie safely
  const getCookieJson = (name) => {
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return match ? JSON.parse(decodeURIComponent(match[1])) : [];
    } catch {
      return [];
    }
  };

  // Helper to write a JSON cookie
  const setCookieJson = (name, value) => {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=31536000;`;
  };

  const refresh = async () => {
    try {
      const res = await fetch("/api/dashboard/notifications", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const readIds = getCookieJson(`orin_read_notifications${userSuffix}`);
        const clearedIds = getCookieJson(`orin_cleared_notifications${userSuffix}`);

        const filtered = data
          .filter((item) => !clearedIds.includes(item.id))
          .map((item) => ({
            ...item,
            unread: item.unread && !readIds.includes(item.id),
          }));

        setNotifications(filtered);
        setUnreadCount(filtered.filter((item) => item.unread).length);
      }
    } catch (err) {
      console.warn("[NotificationsContext] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    // Poll for new notifications
    const intervalId = setInterval(refresh, 45000);
    return () => clearInterval(intervalId);
  }, [user]);

  const markAsRead = (id) => {
    const readIds = getCookieJson(`orin_read_notifications${userSuffix}`);
    const nextReadIds = readIds.includes(id) ? readIds : [...readIds, id];
    setCookieJson(`orin_read_notifications${userSuffix}`, nextReadIds);

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const readIds = getCookieJson(`orin_read_notifications${userSuffix}`);
    const activeIds = notifications.map((item) => item.id);
    const nextReadIds = Array.from(new Set([...readIds, ...activeIds]));
    setCookieJson(`orin_read_notifications${userSuffix}`, nextReadIds);

    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    const clearedIds = getCookieJson(`orin_cleared_notifications${userSuffix}`);
    const activeIds = notifications.map((item) => item.id);
    const nextClearedIds = Array.from(new Set([...clearedIds, ...activeIds]));
    setCookieJson(`orin_cleared_notifications${userSuffix}`, nextClearedIds);

    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
        refresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
