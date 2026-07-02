"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "@/dashboard/components/dashboard.module.css";
import Sidebar from "@/dashboard/components/Sidebar";
import { useAuth } from "@/frontend/lib/authContext";
import { useNotifications } from "@/dashboard/lib/notificationsContext";
import { ACCENT_THEMES, getAccentCookie, setAccentCookie, applyAccent } from "@/frontend/lib/accentTheme";

import { useDashboardSettings } from "../layout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}


export default function SettingsClient({
  navItems,
  isDarkInitial,
  initialNotifications,
  initialLastUpdatedLabel,
  initialSettings,
}) {
  const { user, updateProfile, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { isSidebarCollapsed, setIsSidebarCollapsed, mounted } = useDashboardSettings();
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();
  const [activeAccent, setActiveAccent] = useState("indigo");

  useEffect(() => {
    const currentAccent = getAccentCookie();
    setActiveAccent(currentAccent);
  }, []);

  const handleAccentSelect = (accentName) => {
    setActiveAccent(accentName);
    setAccentCookie(accentName);
    applyAccent(accentName);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("orin-accent-changed", { detail: { accent: accentName } })
      );
    }
  };

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postsPerPage, setPostsPerPage] = useState(initialSettings?.postsPerPage ?? 8);
  const [contentSuccessMessage, setContentSuccessMessage] = useState("");
  const [contentErrorMessage, setContentErrorMessage] = useState("");
  const [isContentSaving, setIsContentSaving] = useState(false);

  // Redesigned Settings Tab & General States
  const [activeTab, setActiveTab] = useState("profile");
  const [siteName, setSiteName] = useState(initialSettings?.siteName ?? "ORIN");
  const [siteDescription, setSiteDescription] = useState(initialSettings?.siteDescription ?? "Minimal Blog For WordPress - Just another WordPress site");
  const [allowComments, setAllowComments] = useState(initialSettings?.allowComments ?? true);
  const [generalSuccessMessage, setGeneralSuccessMessage] = useState("");
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [isGeneralSaving, setIsGeneralSaving] = useState(false);

  // Change Password States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API Token State
  const [apiToken, setApiToken] = useState("");
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const activeSuccess = successMessage || contentSuccessMessage || generalSuccessMessage || passwordSuccessMessage;
  const activeError = errorMessage || contentErrorMessage || generalErrorMessage || passwordErrorMessage;

  const clearAllMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setContentSuccessMessage("");
    setContentErrorMessage("");
    setGeneralSuccessMessage("");
    setGeneralErrorMessage("");
    setPasswordSuccessMessage("");
    setPasswordErrorMessage("");
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setAvatar(user.avatar || "");
      setBio(user.bio || "");
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
      // Close search on outside click
      if (
        event.target instanceof Element &&
        !event.target.closest('[class*="searchBar"]') &&
        !event.target.closest('[aria-label*="Search"]') &&
        !event.target.closest('[aria-label*="search"]')
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }

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

  // Auto-clear success/error alert messages after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (contentSuccessMessage) {
      const timer = setTimeout(() => setContentSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [contentSuccessMessage]);

  useEffect(() => {
    if (contentErrorMessage) {
      const timer = setTimeout(() => setContentErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [contentErrorMessage]);

  useEffect(() => {
    if (passwordSuccessMessage) {
      const timer = setTimeout(() => setPasswordSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccessMessage]);

  useEffect(() => {
    if (passwordErrorMessage) {
      const timer = setTimeout(() => setPasswordErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [passwordErrorMessage]);

  useEffect(() => {
    if (generalSuccessMessage) {
      const timer = setTimeout(() => setGeneralSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [generalSuccessMessage]);

  useEffect(() => {
    if (generalErrorMessage) {
      const timer = setTimeout(() => setGeneralErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [generalErrorMessage]);

  // Clear all status messages when active tab changes
  useEffect(() => {
    clearAllMessages();
  }, [activeTab]);

  // Safety check: Reset activeTab to "profile" if a non-admin lands on admin-only tabs
  useEffect(() => {
    if (user && user.role !== "admin" && (activeTab === "appearance" || activeTab === "content")) {
      setActiveTab("profile");
    }
  }, [user, activeTab]);



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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!displayName.trim()) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email address cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile(displayName.trim(), avatar, bio.trim(), email.trim());
      setSuccessMessage("Profile settings updated successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to update profile settings.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleContentSave = async (event) => {
    event.preventDefault();
    setContentSuccessMessage("");
    setContentErrorMessage("");

    const nextPostsPerPage = Number.parseInt(String(postsPerPage), 10);
    if (!Number.isFinite(nextPostsPerPage) || nextPostsPerPage < 1 || nextPostsPerPage > 30) {
      setContentErrorMessage("Posts per page must be between 1 and 30.");
      return;
    }

    setIsContentSaving(true);

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postsPerPage: nextPostsPerPage }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setContentErrorMessage(result.error || "Unable to save content settings.");
        return;
      }

      setPostsPerPage(result.settings?.postsPerPage ?? nextPostsPerPage);
      setContentSuccessMessage(result.message || "Content settings saved successfully.");
    } catch {
      setContentErrorMessage("Network error while saving content settings.");
    } finally {
      setIsContentSaving(false);
    }
  };

  const handleGeneralSave = async (event) => {
    event.preventDefault();
    setGeneralSuccessMessage("");
    setGeneralErrorMessage("");
    setIsGeneralSaving(true);

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteName: siteName.trim(),
          siteDescription: siteDescription.trim(),
          allowComments,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGeneralErrorMessage(result.error || "Unable to save general settings.");
        return;
      }

      setGeneralSuccessMessage(result.message || "General settings saved successfully.");
    } catch {
      setGeneralErrorMessage("Network error while saving general settings.");
    } finally {
      setIsGeneralSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!apiToken) return;
    navigator.clipboard.writeText(apiToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const setThemeValue = (value) => {
    setIsDark(value);
    document.body.classList.toggle("bwp-dark-style", value);
    setThemeCookie(value);
  };

  const generateToken = () => {
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiToken(`orin_live_${randomHex}`);
    setIsTokenVisible(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSuccessMessage("");
    setPasswordErrorMessage("");

    if (newPassword.length !== 6) {
      setPasswordErrorMessage("Password must be exactly 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      if (user && user.id) {
        const localRes = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!localRes.ok) {
          const errData = await localRes.json().catch(() => ({}));
          setPasswordErrorMessage(errData.error || "Failed to update account password.");
          return;
        }
      }

      setPasswordSuccessMessage("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("[Settings] Password change error:", err);
      setPasswordErrorMessage("Failed to update password.");
    } finally {
      setIsPasswordSaving(false);
    }
  };
  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""} ${!mounted ? styles.noTransition : ""}`}>
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
                <div className={`${styles.hamburgerIcon} ${!isSidebarCollapsed ? styles.hamburgerIconOpen : ""}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
              <div className={styles.topIcons}>
                <Link href="/" className={styles.iconButton} aria-label="Website preview">
                  <i className="fas fa-home"></i>
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
                      <div style={{ position: "relative", width: "20px", height: "20px", borderRadius: "50%", overflow: "hidden", display: "inline-block" }}>
                        <Image
                          src={user.avatar}
                          alt="Profile"
                          fill
                          sizes="20px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </button>

                  {isProfileOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileDropdownAvatar} style={{ position: "relative", overflow: "hidden" }}>
                          {user?.avatar ? (
                            <Image src={user.avatar} alt="Profile" fill sizes="60px" style={{ objectFit: "cover" }} />
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
                          <i className="fas fa-home"></i>
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
                    type="text"
                    className="bwp-search-field"
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
                    Manage profile info, website identity, and theme options.
                  </p>
                </div>
              </div>

              <div className={styles.settingsLayoutContainer}>
                {/* Top navigation tab bar */}
                <nav className={styles.settingsSidebarNav} aria-label="Settings sections">
                  <button
                    type="button"
                    className={`${styles.settingsSidebarTab} ${activeTab === "profile" ? styles.settingsSidebarTabActive : ""}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <i className="fas fa-user-circle" />
                    <span className={styles.settingsTabTitle}>Profile & Access</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.settingsSidebarTab} ${activeTab === "general" ? styles.settingsSidebarTabActive : ""}`}
                    onClick={() => setActiveTab("general")}
                  >
                    <i className="fas fa-sliders-h" />
                    <span className={styles.settingsTabTitle}>Account Security</span>
                  </button>

                  {user?.role === "admin" && (
                    <>
                      <button
                        type="button"
                        className={`${styles.settingsSidebarTab} ${activeTab === "appearance" ? styles.settingsSidebarTabActive : ""}`}
                        onClick={() => setActiveTab("appearance")}
                      >
                        <i className="fas fa-palette" />
                        <span className={styles.settingsTabTitle}>Appearance</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.settingsSidebarTab} ${activeTab === "content" ? styles.settingsSidebarTabActive : ""}`}
                        onClick={() => setActiveTab("content")}
                      >
                        <i className="fas fa-file-alt" />
                        <span className={styles.settingsTabTitle}>Content Layout</span>
                      </button>
                    </>
                  )}
                </nav>

                {/* Right content forms */}
                <div className={styles.settingsContentArea}>
                  {activeTab === "general" && (
                    <div className={styles.settingsCard}>
                      <h2 className={styles.settingsTitle}>
                        <i className="fas fa-lock" style={{ color: "var(--dashboard-accent)", fontSize: "14px" }} />
                        Change Password
                      </h2>
                      <p className={styles.settingsSubtitle}>
                        Update your account password to keep your dashboard access secure.
                      </p>
                      {/* Inline alerts removed in favor of floating toasts */}

                      <form onSubmit={handlePasswordChange}>
                        <div className={styles.settingsFormGroup}>
                          <label className={styles.settingsLabel}>New Password</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              className={styles.settingsInput}
                              style={{ paddingRight: "40px" }}
                              value={newPassword}
                              maxLength={6}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (exactly 6 chars)"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "var(--dashboard-text-muted)",
                                cursor: "pointer",
                                padding: "4px"
                              }}
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              <i className={`fas fa-${showNewPassword ? "eye-slash" : "eye"}`} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.settingsFormGroup} style={{ marginBottom: "20px" }}>
                          <label className={styles.settingsLabel}>Confirm New Password</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className={styles.settingsInput}
                              style={{ paddingRight: "40px" }}
                              value={confirmPassword}
                              maxLength={6}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "var(--dashboard-text-muted)",
                                cursor: "pointer",
                                padding: "4px"
                              }}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              <i className={`fas fa-${showConfirmPassword ? "eye-slash" : "eye"}`} />
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isPasswordSaving}
                          className={styles.toolbarButtonPrimary}
                          style={{
                            cursor: isPasswordSaving ? "not-allowed" : "pointer",
                          }}
                        >
                          <i className={`fas fa-${isPasswordSaving ? "spinner fa-spin" : "key"}`} />
                          <span>{isPasswordSaving ? "Updating Password..." : "Update Password"}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {activeTab === "appearance" && (
                    <>
                      {/* Theme Selector */}
                      <div className={styles.settingsCard}>
                        <h2 className={styles.settingsTitle}>
                          <i className="fas fa-moon" style={{ color: "var(--dashboard-accent)", fontSize: "14px" }} />
                          Dashboard Mode
                        </h2>
                        <p className={styles.settingsSubtitle} style={{ marginBottom: "12px" }}>
                          Customize how ORIN Dashboard looks on your screen. Select between Light and Dark themes.
                        </p>

                        <div className={styles.themeSelectorGroup}>
                          <button
                            type="button"
                            className={`${styles.themeButton} ${!isDark ? styles.themeButtonActive : ""}`}
                            onClick={() => setThemeValue(false)}
                          >
                            <i className="fas fa-sun" />
                            <span>Light Mode</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.themeButton} ${isDark ? styles.themeButtonActive : ""}`}
                            onClick={() => setThemeValue(true)}
                          >
                            <i className="fas fa-moon" />
                            <span>Dark Mode</span>
                          </button>
                        </div>
                      </div>

                      {/* Accent Selector */}
                      <div className={styles.settingsCard}>
                        <h2 className={styles.settingsTitle}>
                          <i className="fas fa-palette" style={{ color: "var(--dashboard-accent)", fontSize: "14px" }} />
                          Accent Color Theme
                        </h2>
                        <p className={styles.settingsSubtitle} style={{ marginBottom: "12px" }}>
                          Choose your preferred accent color for buttons, active states, icons, and highlights.
                        </p>

                        <div className={styles.accentPickerRow}>
                          {Object.entries(ACCENT_THEMES).map(([key, val]) => {
                            const isActive = activeAccent === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                className={`${styles.accentCircle} ${isActive ? styles.accentCircleActive : ""}`}
                                onClick={() => handleAccentSelect(key)}
                                style={{ "--accent-color": val.color }}
                                title={val.name}
                                aria-label={val.name}
                              >
                                {isActive && <i className="fas fa-check" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </>
                  )}

                  {activeTab === "content" && (
                    <div className={styles.settingsCard}>
                      <h2 className={styles.settingsTitle}>
                        <i className="fas fa-file-alt" style={{ color: "var(--dashboard-accent)", fontSize: "14px" }} />
                        Content Layout
                      </h2>
                      <p className={styles.settingsSubtitle}>
                        Manage feed display counts and pagination limits for your homepage posts.
                      </p>
                      {/* Inline alerts removed in favor of floating toasts */}

                      <form onSubmit={handleContentSave}>
                        <div className={styles.settingsFormGroup} style={{ marginBottom: "20px" }}>
                          <label className={styles.settingsLabel}>Posts per page</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className={styles.settingsInput}
                            value={postsPerPage}
                            onChange={(event) => setPostsPerPage(event.target.value)}
                            required
                          />
                          <span style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", marginTop: "4px" }}>
                            Choose a value between 1 and 30.
                          </span>
                        </div>

                        <button
                          type="submit"
                          className={styles.toolbarButtonPrimary}
                          disabled={isContentSaving}
                          style={{
                            cursor: isContentSaving ? "not-allowed" : "pointer",
                          }}
                        >
                          <i className={`fas fa-${isContentSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                          <span>{isContentSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {activeTab === "profile" && (
                    <>
                      {/* Profile Card */}
                      <div className={styles.settingsCard}>
                        <h2 className={styles.settingsTitle}>
                          <i className="fas fa-user-circle" style={{ color: "var(--dashboard-accent)", fontSize: "14px" }} />
                          Profile Settings
                        </h2>
                        <p className={styles.settingsSubtitle}>
                          Update your display details and upload your profile picture.
                        </p>
                        {/* Inline alerts removed in favor of floating toasts */}

                        <form onSubmit={handleProfileSave}>
                          <div className={styles.avatarWidget} style={{ gap: "16px", marginBottom: "20px" }}>
                            <div className={styles.avatarContainer} style={{ width: "70px", height: "70px" }}>
                              <div className={styles.avatarPreview} style={{ position: "relative", width: "70px", height: "70px", overflow: "hidden" }}>
                                {avatar ? (
                                  <Image src={avatar} alt="Avatar" fill sizes="70px" style={{ objectFit: "cover" }} />
                                ) : (
                                  <span style={{ fontSize: "24px", fontWeight: "700", color: "var(--dashboard-accent)" }}>
                                    {displayName ? displayName[0].toUpperCase() : "U"}
                                  </span>
                                )}
                              </div>

                              {avatar ? (
                                <button
                                  type="button"
                                  className={styles.avatarRemoveBtn}
                                  onClick={handleRemoveAvatar}
                                  title="Remove picture"
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    right: "-1px",
                                    bottom: "-1px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                    margin: 0
                                  }}
                                >
                                  <i className="fas fa-trash-alt" style={{ fontSize: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 0 }} />
                                </button>
                              ) : (
                                <label
                                  className={styles.avatarUploadBtn}
                                  htmlFor="avatar-upload-file"
                                  title="Upload picture"
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    right: "-1px",
                                    bottom: "-1px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                    margin: 0
                                  }}
                                >
                                  <i className="fas fa-camera" style={{ fontSize: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 0 }} />
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
                                <div className={styles.avatarUploadingOverlay}>
                                  <i className="fas fa-spinner fa-spin" style={{ color: "#ffffff", fontSize: "14px" }} />
                                </div>
                              )}
                            </div>

                            <div className={styles.avatarInfo}>
                              <h3 className={styles.avatarInfoTitle} style={{ fontSize: "13.5px" }}>Profile Avatar</h3>
                              <p className={styles.avatarInfoDesc} style={{ fontSize: "11px" }}>PNG or JPG image (Max. 2MB)</p>
                            </div>
                          </div>

                          <div className={styles.settingsFormGrid}>
                            <div className={styles.settingsFormGroup}>
                              <label className={styles.settingsLabel}>Display Name</label>
                              <input
                                type="text"
                                className={styles.settingsInput}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                              />
                            </div>
                            <div className={styles.settingsFormGroup}>
                              <label className={styles.settingsLabel}>Email Address</label>
                              <input
                                type="email"
                                className={styles.settingsInput}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={user?.role !== "admin"}
                                required
                              />
                            </div>
                          </div>

                          <div className={styles.settingsFormGrid} style={{ marginBottom: "12px" }}>
                            <div className={styles.settingsFormGroup}>
                              <label className={styles.settingsLabel}>Account Role</label>
                              <input
                                type="text"
                                className={styles.settingsInput}
                                value={role}
                                disabled
                                style={{ textTransform: "capitalize" }}
                              />
                            </div>
                          </div>

                          <div className={styles.settingsFormGroup} style={{ marginBottom: "20px" }}>
                            <label className={styles.settingsLabel}>Biography / Author Info</label>
                            <textarea
                              className={styles.settingsTextarea}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              placeholder="Write a brief biography to display on your posts..."
                              rows={4}
                            />
                            <span style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", marginTop: "4px", display: "block" }}>
                              This bio will be shown at the end of each post you write.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={isSaving}
                            className={styles.toolbarButtonPrimary}
                            style={{
                              cursor: isSaving ? "not-allowed" : "pointer",
                            }}
                          >
                            <i className={`fas fa-${isSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                            <span>{isSaving ? "Saving Profile..." : "Save Profile"}</span>
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>

      {/* Toast Notifications */}
      {(activeSuccess || activeError) && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "380px",
            maxWidth: "calc(100vw - 48px)"
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes orinToastSlideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes orinToastShrink {
              from { width: 100%; }
              to { width: 0%; }
            }
            .orin-toast-item {
              animation: orinToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              background: var(--dashboard-card-bg);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid var(--dashboard-card-border);
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
              padding: 16px;
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .orin-toast-body {
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }
            .orin-toast-icon {
              font-size: 18px;
              margin-top: 2px;
            }
            .orin-toast-content {
              flex: 1;
              font-size: 13.5px;
              line-height: 1.4;
              color: var(--dashboard-text);
              font-family: var(--font-poppins), sans-serif;
            }
            .orin-toast-close {
              background: transparent;
              border: none;
              color: var(--dashboard-text-muted);
              cursor: pointer;
              font-size: 14px;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: color 0.15s ease;
              margin-top: 1px;
            }
            .orin-toast-close:hover {
              color: var(--dashboard-text);
            }
            .orin-toast-progress {
              position: absolute;
              bottom: 0;
              left: 0;
              height: 3px;
            }
          ` }} />

          {activeSuccess && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-check-circle" style={{ color: "var(--dashboard-accent)" }}></i>
                </div>
                <div className="orin-toast-content">
                  {activeSuccess}
                </div>
                <button className="orin-toast-close" onClick={clearAllMessages} aria-label="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div
                className="orin-toast-progress"
                style={{
                  background: "var(--dashboard-accent)",
                  animation: "orinToastShrink 4000ms linear forwards"
                }}
              />
            </div>
          )}

          {activeError && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-exclamation-circle" style={{ color: "#f43f5e" }}></i>
                </div>
                <div className="orin-toast-content" style={{ fontWeight: 500 }}>
                  {activeError}
                </div>
                <button className="orin-toast-close" onClick={clearAllMessages} aria-label="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div
                className="orin-toast-progress"
                style={{
                  background: "#f43f5e",
                  animation: "orinToastShrink 4000ms linear forwards"
                }}
              />
            </div>
          )}
        </div>
      )}
          </div>
        </div>
  );
}