"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { useAuth } from "../../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function UsersClient({ navItems, isDarkInitial, initialNotifications, initialLastUpdatedLabel }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    const onDocumentMouseDown = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("mousedown", onDocumentMouseDown);

    return () => {
      window.removeEventListener("keydown", onDocumentKeyDown);
      window.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  const notifications = (initialNotifications ?? []).map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => !current);
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  const handleNotificationClick = (notificationId) => {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId]
    );
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/users"
          />

          <div className={styles.mainWrapper}>
            <div className={styles.topbar}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleSidebarToggle}
                aria-label="Toggle sidebar"
                style={{ marginRight: "auto" }}
              >
                <i className="fas fa-bars" style={{ fontSize: "16px" }}></i>
              </button>
              <div className={styles.topIcons}>
                <Link href="/" className={styles.iconButton} aria-label="Website preview">
                  <i className="fas fa-globe"></i>
                </Link>
                <button
                  type="button"
                  className={`${styles.iconButton} ${isDark ? styles.iconButtonActive : ""}`}
                  aria-label="Toggle theme"
                  onClick={handleThemeToggle}
                >
                  <i className={`fas fa-${isDark ? "sun" : "moon"}`}></i>
                </button>
                <div className={styles.topOverlay} ref={notificationsRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
                    onClick={handleNotificationsToggle}
                  >
                    <i className="fas fa-bell"></i>
                    {unreadNotifications > 0 && (
                      <span className={styles.notificationBadge}>
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className={styles.notificationDropdown}>
                      <div className={styles.notificationHeader}>
                        <div>
                          <h2 className={styles.notificationTitle}>Notifications</h2>
                          <p className={styles.notificationSubtitle}>
                            {unreadNotifications} unread update
                            {unreadNotifications === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.notificationAction}
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className={styles.notificationList}>
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`${styles.notificationItem} ${item.unread ? styles.notificationItemUnread : ""}`}
                            onClick={() => handleNotificationClick(item.id)}
                            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                          >
                            <div className={styles.notificationItemBody}>
                              <p className={styles.notificationItemText}>{item.title}</p>
                              <span className={styles.notificationItemTime}>{item.time}</span>
                            </div>
                            {item.unread && <span className={styles.notificationUnreadDot} />}
                          </button>
                        ))}
                        {notifications.length === 0 && (
                          <div className={styles.notificationEmpty}>
                            No new notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <main className={styles.main}>
              <header className={styles.header}>
                <div className={styles.headerInfo}>
                  <h1 className={styles.pageTitle}>User Profile</h1>
                  <p className={styles.pageSubtitle}>
                    Manage and view details for the currently logged-in account.
                  </p>
                </div>
              </header>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", padding: "0 24px 24px" }}>
                {/* Profile Detail Card */}
                <div style={{
                  backgroundColor: "var(--dashboard-bg-surface)",
                  borderRadius: "4px",
                  border: "1px solid var(--dashboard-border-soft)",
                  padding: "30px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {/* User Profile Header details */}
                  <div style={{ display: "flex", gap: "24px", alignItems: "center", borderBottom: "1px solid var(--dashboard-border-soft)", paddingBottom: "24px" }}>
                    <div style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "2px solid var(--dashboard-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      fontSize: "36px",
                      fontWeight: "700",
                      color: "var(--dashboard-blue)"
                    }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        user?.name ? user.name[0].toUpperCase() : "U"
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--dashboard-text)", margin: "0 0 4px" }}>
                        {user?.name || "N/A"}
                      </h2>
                      <span style={{
                        padding: "4px 10px",
                        backgroundColor: "rgba(111, 111, 255, 0.15)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        color: "var(--dashboard-blue)",
                        letterSpacing: "0.5px"
                      }}>
                        {user?.role || "Author"}
                      </span>
                    </div>
                  </div>

                  {/* Profile info Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                    {/* Email detail */}
                    <div style={{
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "2px",
                      padding: "16px 20px"
                    }}>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Email Address
                      </span>
                      <strong style={{ fontSize: "14px", color: "var(--dashboard-text)", wordBreak: "break-all" }}>
                        {user?.email || "N/A"}
                      </strong>
                    </div>

                    {/* Joined Date Detail */}
                    <div style={{
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "2px",
                      padding: "16px 20px"
                    }}>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Member Since
                      </span>
                      <strong style={{ fontSize: "14px", color: "var(--dashboard-text)" }}>
                        {formatDate(user?.joinedAt)}
                      </strong>
                    </div>

                    {/* Account Status */}
                    <div style={{
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "2px",
                      padding: "16px 20px"
                    }}>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Account Status
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                        <strong style={{ fontSize: "14px", color: "#10b981" }}>Active</strong>
                      </div>
                    </div>

                    {/* Auth provider */}
                    <div style={{
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "2px",
                      padding: "16px 20px"
                    }}>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Authentication Provider
                      </span>
                      <strong style={{ fontSize: "14px", color: "var(--dashboard-text)", textTransform: "capitalize" }}>
                        {user?.provider || "Credentials"}
                      </strong>
                    </div>
                  </div>

                  {/* Permissions Checklist */}
                  <div style={{
                    backgroundColor: "var(--dashboard-bg-shell)",
                    border: "1px solid var(--dashboard-border-soft)",
                    borderRadius: "2px",
                    padding: "20px 24px",
                    marginTop: "10px"
                  }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dashboard-text)", margin: "0 0 14px" }}>
                      Authorized Features & Clearances
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <li style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fas fa-check" style={{ color: "#10b981", fontSize: "12px" }} />
                        View dashboard overview data
                      </li>
                      <li style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fas fa-check" style={{ color: "#10b981", fontSize: "12px" }} />
                        Create and edit blog posts
                      </li>
                      <li style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fas fa-check" style={{ color: "#10b981", fontSize: "12px" }} />
                        Modify personal profile details
                      </li>
                      {user?.role === "admin" ? (
                        <>
                          <li style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="fas fa-check" style={{ color: "#10b981", fontSize: "12px" }} />
                            Manage categories & taxonomy
                          </li>
                          <li style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="fas fa-check" style={{ color: "#10b981", fontSize: "12px" }} />
                            Access analytics reporting panels
                          </li>
                        </>
                      ) : (
                        <>
                          <li style={{ fontSize: "13px", color: "var(--dashboard-text-muted)", display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>
                            <i className="fas fa-lock" style={{ color: "var(--dashboard-text-muted)", fontSize: "12px" }} />
                            Manage categories (Admin only)
                          </li>
                          <li style={{ fontSize: "13px", color: "var(--dashboard-text-muted)", display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>
                            <i className="fas fa-lock" style={{ color: "var(--dashboard-text-muted)", fontSize: "12px" }} />
                            Access analytics panels (Admin only)
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <Link
                      href="/dashboard/settings"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "transparent",
                        color: "var(--dashboard-text)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "2px",
                        fontSize: "13px",
                        fontWeight: "600",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                    >
                      <i className="fas fa-edit" style={{ marginRight: "6px" }} />
                      Edit Settings
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
