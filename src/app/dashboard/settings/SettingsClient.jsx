"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { useAuth } from "../../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function SettingsClient({ navItems, isDarkInitial, initialNotifications, initialLastUpdatedLabel }) {
  const { user, updateProfileName } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const notificationsRef = useRef(null);

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // API Token State
  const [apiToken, setApiToken] = useState("");
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setAvatar(user.avatar || "");
    }
  }, [user]);

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
    setIsNotificationsOpen((current) => {
      const next = !current;
      if (next) {
        setIsNotificationsOpen(true);
      }
      return next;
    });
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

  const handleProfileSave = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!displayName.trim()) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    setIsSaving(true);

    // Simulate saving changes
    setTimeout(() => {
      try {
        updateProfileName(displayName.trim());
        setSuccessMessage("Profile settings updated successfully!");
      } catch (err) {
        setErrorMessage("Failed to update profile settings.");
      } finally {
        setIsSaving(false);
      }
    }, 600);
  };

  const generateToken = () => {
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiToken(`orin_live_${randomHex}`);
    setIsTokenVisible(true);
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/settings"
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
                <button type="button" className={styles.iconButton} aria-label="Profile">
                  <i className="fas fa-user"></i>
                </button>
              </div>
            </div>

            <main className={styles.main}>
              <header className={styles.header}>
                <div className={styles.headerInfo}>
                  <h1 className={styles.pageTitle}>Settings</h1>
                  <p className={styles.pageSubtitle}>
                    Manage profile info, credentials, and app preferences.
                  </p>
                </div>
              </header>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", padding: "0 24px 24px" }}>
                {/* Profile Card */}
                <div style={{
                  backgroundColor: "var(--dashboard-bg-surface)",
                  borderRadius: "4px",
                  border: "1px solid var(--dashboard-border-soft)",
                  padding: "24px"
                }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--dashboard-text)" }}>
                    Profile Settings
                  </h2>

                  {successMessage && (
                    <div style={{
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "2px",
                      color: "#34d399",
                      padding: "12px",
                      marginBottom: "16px",
                      fontSize: "13px"
                    }}>
                      <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
                      {successMessage}
                    </div>
                  )}

                  {errorMessage && (
                    <div style={{
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "2px",
                      color: "#f87171",
                      padding: "12px",
                      marginBottom: "16px",
                      fontSize: "13px"
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleProfileSave}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "var(--dashboard-bg-shell)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "2px",
                            color: "var(--dashboard-text)",
                            padding: "0 12px",
                            fontSize: "13px",
                            outline: "none"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "var(--dashboard-bg-shell)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "2px",
                            color: "var(--dashboard-text-muted)",
                            padding: "0 12px",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "not-allowed",
                            opacity: 0.6
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                          Account Role
                        </label>
                        <input
                          type="text"
                          value={role}
                          disabled
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "var(--dashboard-bg-shell)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "2px",
                            color: "var(--dashboard-text-muted)",
                            padding: "0 12px",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "not-allowed",
                            opacity: 0.6,
                            textTransform: "capitalize"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                          Avatar URL
                        </label>
                        <input
                          type="text"
                          value={avatar}
                          disabled
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "var(--dashboard-bg-shell)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "2px",
                            color: "var(--dashboard-text-muted)",
                            padding: "0 12px",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "not-allowed",
                            opacity: 0.6
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        padding: "10px 24px",
                        backgroundColor: "var(--dashboard-blue)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "2px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        opacity: isSaving ? 0.7 : 1,
                        transition: "all 0.2s"
                      }}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>

                {/* API Credentials Card */}
                <div style={{
                  backgroundColor: "var(--dashboard-bg-surface)",
                  borderRadius: "4px",
                  border: "1px solid var(--dashboard-border-soft)",
                  padding: "24px"
                }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: "var(--dashboard-text)" }}>
                    API Credentials
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--dashboard-text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                    Generate API tokens for headless integration or server-side automation.
                  </p>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                    <button
                      onClick={generateToken}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "transparent",
                        color: "var(--dashboard-text)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "2px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Generate New Token
                    </button>
                  </div>

                  {apiToken && (
                    <div style={{
                      backgroundColor: "var(--dashboard-bg-shell)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "2px",
                      padding: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <code style={{ fontFamily: "monospace", color: "var(--dashboard-blue)", fontSize: "13px" }}>
                        {isTokenVisible ? apiToken : "••••••••••••••••••••••••••••••••••••••••"}
                      </code>
                      <button
                        onClick={() => setIsTokenVisible(!isTokenVisible)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--dashboard-text-muted)",
                          cursor: "pointer",
                          fontSize: "13px"
                        }}
                      >
                        <i className={`fas fa-${isTokenVisible ? "eye-slash" : "eye"}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
