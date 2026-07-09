"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/frontend/lib/authContext";
import { useRouter } from "next/navigation";

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: (id) => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  refresh: async () => {},
});

export function NotificationsProvider({ children, initialNotifications = undefined, initialUnreadCount = 0 }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications ?? []);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(initialNotifications === undefined ? true : false);
  
  // Real-time WhatsApp Toast States
  const [activeToasts, setActiveToasts] = useState([]);
  const isInitialFetchRef = useRef(true);

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
    // Don't fetch if no user is logged in
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/dashboard/notifications", {
        cache: "no-store",
      });
      // If unauthorized (session lost), stop silently — do not loop
      if (res.status === 401) {
        console.warn("[NotificationsContext] Session expired (401). Stopping polling.");
        setLoading(false);
        return;
      }
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

        // Real-time WhatsApp-style Toast Trigger (using cookie tracking to persist across sessions/refreshes)
        const toastedIds = getCookieJson(`orin_toasted_notifications${userSuffix}`);
        let nextToastedIds = [...toastedIds];
        let hasNewToast = false;

        filtered.forEach((item) => {
          if (item.type === "contact-message" && item.unread && !toastedIds.includes(item.id)) {
            // Only trigger visual toasts if this isn't the first fetch on this device
            if (!isInitialFetchRef.current) {
              // Prepare toast details
            const dateObj = new Date(item.createdAt);
            let toastTime = "Just now";
            if (!isNaN(dateObj.getTime())) {
              const now = new Date();
              const isToday = dateObj.toDateString() === now.toDateString();
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              const isYesterday = dateObj.toDateString() === yesterday.toDateString();

              if (isToday) {
                toastTime = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
              } else if (isYesterday) {
                toastTime = `Yesterday, ${dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}`;
              } else {
                toastTime = `${dateObj.toLocaleDateString([], { month: "short", day: "numeric" })}, ${dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}`;
              }
            }

            // Extract sender name from title if actorName is null/missing (e.g. for legacy notification formats)
            let senderName = item.actorName;
            if (!senderName && item.title) {
              const nameMatch = item.title.match(/New message from ([^(]+)/);
              if (nameMatch && nameMatch[1]) {
                senderName = nameMatch[1].trim();
              }
            }
            if (!senderName) {
              senderName = "New Message";
            }

            // Fallback message content to subject if messageText is missing
            const messageBody = item.messageText || (item.targetName ? `Subject: ${item.targetName}` : "Sent a contact message");

            const newToast = {
              id: item.id,
              name: senderName,
              time: toastTime,
              message: messageBody,
            };

            setActiveToasts((currentToasts) => {
              if (currentToasts.some((t) => t.id === newToast.id)) {
                return currentToasts;
              }
              return [...currentToasts, newToast];
            });
            }

            // Remember that we toasted this notification ID
            nextToastedIds.push(item.id);
            hasNewToast = true;

            if (!isInitialFetchRef.current) {
              // Auto remove after 8 seconds
              setTimeout(() => {
                setActiveToasts((currentToasts) =>
                  currentToasts.filter((t) => t.id !== newToast.id)
                );
              }, 8000);
            }
          }
        });

        isInitialFetchRef.current = false;

        if (hasNewToast) {
          setCookieJson(`orin_toasted_notifications${userSuffix}`, nextToastedIds);
        }
      }
    } catch (err) {
      console.warn("[NotificationsContext] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (initialNotifications === undefined) {
      refresh();
    }

    // Poll every 30s — only when user is authenticated
    const intervalId = setInterval(refresh, 30000);
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

      {/* Real-time WhatsApp-style Toast Notification Feed */}
      {activeToasts.length > 0 && (
        <div className="whatsapp-toast-container">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="whatsapp-toast"
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={(e) => {
                if (e.target.closest('.whatsapp-close-btn')) {
                  return;
                }
                const targetUrl = `/dashboard/messages?id=${toast.id}`;
                if (window.location.pathname === "/dashboard/messages") {
                  // Already on Messages page — update URL and fire custom event
                  // for the page to handle without a full navigation
                  window.history.pushState(null, "", targetUrl);
                  window.dispatchEvent(new CustomEvent("orin-message-selected", { detail: { id: toast.id } }));
                } else {
                  // Bug #5 fix: Use router.push() instead of window.location.href
                  // to navigate without a full page reload, preserving React state.
                  router.push(targetUrl);
                }
              }}
            >
              <div className="whatsapp-toast-header">
                <div className="whatsapp-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="whatsapp-meta">
                  <div className="whatsapp-meta-row">
                    <span className="whatsapp-name">{toast.name}</span>
                    <span className="whatsapp-time">{toast.time}</span>
                  </div>
                  <div className="whatsapp-toast-body">
                    {toast.message}
                  </div>
                </div>
                <button
                  type="button"
                  className="whatsapp-close-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
