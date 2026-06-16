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
  const { user, updateProfile, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsList, setNotificationsList] = useState(() => initialNotifications ?? []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    // Sync theme with cookie on mount to handle client-side navigations
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const currentTheme = match ? decodeURIComponent(match[1]) : "";
    const isDarkCookie = currentTheme === "dark";
    if (isDarkCookie !== isDark) {
      setIsDark(isDarkCookie);
    }
  }, []);

  useEffect(() => {
    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    const onDocumentMouseDown = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("mousedown", onDocumentMouseDown);

    return () => {
      window.removeEventListener("keydown", onDocumentKeyDown);
      window.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  const notifications = notificationsList.map((item) => ({
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
        setIsSearchOpen(false);
      }
      return next;
    });
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((current) => {
      const next = !current;
      if (next) {
        setIsNotificationsOpen(false);
      }
      return next;
    });
    setSearchQuery("");
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  const handleClearAll = () => {
    setNotificationsList([]);
  };

  const handleNotificationClick = (notificationId) => {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId]
    );
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("File is too large. Max size is 2MB.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatar(data.avatarUrl);
        setSuccessMessage("Avatar uploaded successfully! Click Save Changes to apply.");
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to upload avatar.");
      }
    } catch (err) {
      setErrorMessage("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    setSuccessMessage("Avatar removed! Click Save Changes to apply.");
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
        updateProfile(displayName.trim(), avatar);
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
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button
                            type="button"
                            className={styles.notificationAction}
                            onClick={handleMarkAllAsRead}
                          >
                            Mark all read
                          </button>
                          <span style={{ color: "var(--dashboard-border-soft)", fontSize: "12px" }}>|</span>
                          <button
                            type="button"
                            className={styles.notificationAction}
                            style={{ color: "var(--dashboard-danger)" }}
                            onClick={handleClearAll}
                          >
                            Clear all
                          </button>
                        </div>
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
                            <span className={styles.notificationDot}></span>
                            <span className={styles.notificationTextWrap}>
                              <span className={styles.notificationItemTitle}>
                                {item.title}
                              </span>
                              <span className={styles.notificationItemMeta}>
                                {item.time}
                              </span>
                            </span>
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
                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search settings"
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>
                <div className={styles.topOverlay} ref={profileRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isProfileOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Profile"
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationsOpen(false);
                      setIsSearchOpen(false);
                    }}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </button>

                  {isProfileOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileDropdownAvatar}>
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" />
                          ) : (
                            <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
                          )}
                        </div>
                        <div className={styles.profileDropdownInfo}>
                          <h4 className={styles.profileDropdownName}>{user?.name || "User Admin"}</h4>
                          <p className={styles.profileDropdownEmail}>{user?.email || "admin@example.com"}</p>
                          <span className={styles.profileDropdownRole}>{user?.role || "Administrator"}</span>
                        </div>
                      </div>

                      <div className={styles.profileDropdownLinks}>
                        <Link
                          href="/dashboard/settings"
                          className={styles.profileDropdownLink}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <i className="fas fa-cog"></i>
                          <span>Profile Settings</span>
                        </Link>
                        <Link
                          href="/"
                          className={styles.profileDropdownLink}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <i className="fas fa-globe"></i>
                          <span>View Website</span>
                        </Link>
                      </div>

                      <div className={styles.profileDropdownFooter}>
                        <button
                          type="button"
                          className={styles.profileDropdownLogout}
                          onClick={async () => {
                            setIsProfileOpen(false);
                            await logout();
                          }}
                        >
                          <i className="fas fa-sign-out-alt"></i>
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isSearchOpen && (
              <div className={styles.searchBar}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search settings..."
                    aria-label="Search settings"
                  />
                </div>
              </div>
            )}

            <main className={styles.content}>
              <div className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Settings</h1>
                  <p className={styles.subtitle}>
                    Manage profile info and app preferences.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", padding: "0 0 24px" }}>
                {/* Profile Card */}
                <div style={{
                  backgroundColor: "var(--dashboard-card-bg)",
                  borderRadius: "18px",
                  border: "1px solid var(--dashboard-card-border)",
                  padding: "32px",
                  boxShadow: "var(--dashboard-shadow)"
                }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: "var(--dashboard-text)" }}>
                    Profile Settings
                  </h2>

                  {successMessage && (
                    <div style={{
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "12px",
                      color: "#10b981",
                      padding: "14px",
                      marginBottom: "24px",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      <i className="fas fa-check-circle" style={{ fontSize: "16px" }} />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div style={{
                      backgroundColor: "rgba(241, 116, 123, 0.12)",
                      border: "1px solid rgba(241, 116, 123, 0.2)",
                      borderRadius: "12px",
                      color: "#f1747b",
                      padding: "14px",
                      marginBottom: "24px",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ fontSize: "16px" }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSave}>
                    {/* Beautiful Avatar Upload Section */}
                    <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px", borderBottom: "1px solid var(--dashboard-border-soft)", paddingBottom: "24px" }}>
                      <div style={{ position: "relative", width: "90px", height: "90px" }}>
                        <div style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          border: "3px solid var(--dashboard-accent-soft)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "var(--dashboard-card-soft)",
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)"
                        }}>
                          {avatar ? (
                            <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "32px", fontWeight: "700", color: "var(--dashboard-accent)" }}>
                              {displayName ? displayName[0].toUpperCase() : "U"}
                            </span>
                          )}
                        </div>

                        {/* Camera button triggers upload OR delete */}
                        {avatar ? (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            style={{
                              position: "absolute",
                              bottom: "-2px",
                              right: "-2px",
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "var(--dashboard-danger)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 4px 10px rgba(239, 68, 68, 0.4)",
                              border: "none",
                              transition: "all 0.2s ease",
                              zIndex: 10
                            }}
                            title="Remove picture"
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: "12px" }} />
                          </button>
                        ) : (
                          <label htmlFor="avatar-upload-file" style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "var(--dashboard-accent)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(111, 111, 255, 0.4)",
                            transition: "all 0.2s ease"
                          }}
                          className={styles.avatarLabelBtn}
                          >
                            <i className="fas fa-camera" style={{ fontSize: "12px" }} />
                            <input
                              type="file"
                              id="avatar-upload-file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              style={{ display: "none" }}
                            />
                          </label>
                        )}

                        {isUploading && (
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "90px",
                            height: "90px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 5
                          }}>
                            <i className="fas fa-spinner fa-spin" style={{ color: "#ffffff", fontSize: "20px" }}></i>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--dashboard-text)" }}>Profile Photo</h3>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          style={{
                            width: "100%",
                            height: "44px",
                            backgroundColor: "var(--dashboard-card-soft)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "12px",
                            color: "var(--dashboard-text)",
                            padding: "0 16px",
                            fontSize: "13px",
                            outline: "none",
                            transition: "all 0.2s"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          style={{
                            width: "100%",
                            height: "44px",
                            backgroundColor: "var(--dashboard-card-soft)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "12px",
                            color: "var(--dashboard-text-muted)",
                            padding: "0 16px",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "not-allowed",
                            opacity: 0.6
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dashboard-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Account Role
                        </label>
                        <input
                          type="text"
                          value={role}
                          disabled
                          style={{
                            width: "100%",
                            height: "44px",
                            backgroundColor: "var(--dashboard-card-soft)",
                            border: "1px solid var(--dashboard-border-soft)",
                            borderRadius: "12px",
                            color: "var(--dashboard-text-muted)",
                            padding: "0 16px",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "not-allowed",
                            opacity: 0.6,
                            textTransform: "capitalize"
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className={styles.toolbarButtonPrimary}
                      style={{
                        padding: "0 30px",
                        height: "44px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <i className={`fas fa-${isSaving ? "spinner fa-spin" : "save"}`} />
                      <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
