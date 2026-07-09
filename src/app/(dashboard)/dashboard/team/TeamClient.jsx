"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "@/dashboard/components/dashboard.module.css";
import Sidebar from "@/dashboard/components/Sidebar";
import { useAuth } from "@/frontend/lib/authContext";
import { useNotifications } from "@/dashboard/lib/notificationsContext";
import { useDashboardSettings } from "../ClientLayout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

const PLATFORM_ICONS = {
  x: "fab fa-x-twitter",
  twitter: "fab fa-x-twitter",
  instagram: "fab fa-instagram",
  pinterest: "fab fa-pinterest-p",
  facebook: "fab fa-facebook-f",
  linkedin: "fab fa-linkedin-in",
  github: "fab fa-github",
  youtube: "fab fa-youtube",
  email: "fas fa-envelope",
  envelope: "fas fa-envelope",
};

function getPlatformIcon(platform) {
  return PLATFORM_ICONS[String(platform).toLowerCase().trim()] || "fas fa-link";
}

// User Avatar helper similar to other dashboard components
function UserAvatar({ src, name, size = 36 }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const showInitials = !src || error;

  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"
  ];

  let backgroundColor = "#8b5cf6";
  if (name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    backgroundColor = colors[colorIndex];
  }

  if (showInitials) {
    const initial = name ? name[0].toUpperCase() : "?";
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.round(size * 0.42)}px`,
        fontWeight: "700",
        color: "#ffffff",
        textTransform: "uppercase",
        userSelect: "none"
      }}>
        {initial}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, borderRadius: "50%", overflow: "hidden", display: "block" }}>
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        onError={() => setError(true)}
        style={{
          objectFit: "cover"
        }}
      />
    </div>
  );
}

export default function TeamClient({
  navItems,
  isDarkInitial,
  initialNotifications,
  initialLastUpdatedLabel,
  initialTeam = [],
}) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const [isDark, setIsDark] = useState(isDarkInitial);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSettings();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const searchBarRef = useRef(null);

  // Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Team Management states
  const [team, setTeam] = useState(initialTeam);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal States for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add or edit
  const [modalForm, setModalForm] = useState({
    id: "",
    name: "",
    role: "",
    image: "",
    bio: "",
    socials: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [modalError, setModalError] = useState("");

  const handleSearchToggle = () => {
    setIsSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
      return next;
    });
    setSearchQuery("");
  };

  const filteredTeam = team.filter(member => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      member.name.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q) ||
      (member.bio && member.bio.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isSearchOpen &&
        searchBarRef.current &&
        !searchBarRef.current.contains(e.target) &&
        !e.target.closest('[aria-label="Search team members"]') &&
        !e.target.closest('.fa-search') &&
        !e.target.closest('.fa-times')
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSearchOpen]);

  // Delete Confirmation States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    // Sync theme on mount
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const currentTheme = match ? decodeURIComponent(match[1]) : "";
    const isDarkCookie = currentTheme === "dark";
    if (isDarkCookie !== isDark) {
      setIsDark(isDarkCookie);
    }
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  // Upload avatar to /api/users/avatar
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setModalError("File is too large. Max size is 2MB.");
      return;
    }

    setIsUploading(true);
    setModalError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setModalForm(prev => ({ ...prev, image: data.avatarUrl }));
      } else {
        const errorData = await res.json().catch(() => ({}));
        setModalError(errorData.error || "Failed to upload photo.");
      }
    } catch (err) {
      setModalError("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save the entire settings payload (including updated team)
  const saveTeamSettings = async (nextTeam) => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamMembers: nextTeam }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setTeam(result.settings?.teamMembers || nextTeam);
        setSuccessMessage("Team configurations updated successfully.");
      } else {
        setErrorMessage(result.error || "Unable to save team configuration.");
      }
    } catch {
      setErrorMessage("Network error while saving team configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder Functions
  const moveMember = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= team.length) return;

    const newTeam = [...team];
    const temp = newTeam[index];
    newTeam[index] = newTeam[nextIndex];
    newTeam[nextIndex] = temp;

    saveTeamSettings(newTeam);
  };

  // Form Submit (Add/Edit)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setModalError("");

    if (!modalForm.name.trim()) {
      setModalError("Name cannot be empty.");
      return;
    }

    if (!modalForm.role.trim()) {
      setModalError("Role cannot be empty.");
      return;
    }

    let newTeam = [...team];
    if (modalMode === "add") {
      const newMember = {
        ...modalForm,
        id: `member-${Date.now()}`
      };
      newTeam.push(newMember);
    } else {
      newTeam = newTeam.map(m => m.id === modalForm.id ? modalForm : m);
    }

    saveTeamSettings(newTeam);
    setIsModalOpen(false);
  };

  // Delete Action Confirm
  const handleDeleteConfirm = () => {
    if (!memberToDelete) return;
    const newTeam = team.filter(m => m.id !== memberToDelete.id);
    saveTeamSettings(newTeam);
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const {
    sidebarPosition: dbSidebarPosition,
  } = useDashboardSettings();

  const isLeft = dbSidebarPosition === "left";
  const layoutClass = `${styles.layout} ${isLeft ? "" : styles.layoutRight} ${isSidebarCollapsed
    ? (isLeft ? styles.layoutSidebarCollapsed : styles.layoutRightSidebarCollapsed)
    : ""
    }`;

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={layoutClass}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/team"
            sidebarPosition={dbSidebarPosition}
          />

          <div className={styles.mainWrapper}>
            {/* Top Navbar */}
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

                {/* Notifications Dropdown */}
                <div className={styles.topOverlay} ref={notificationsRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Notifications"
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsProfileOpen(false);
                    }}
                  >
                    <i className="fas fa-bell"></i>
                    {unreadNotifications > 0 && (
                      <span className={styles.notificationBadge}>{unreadNotifications}</span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <div className={styles.notificationDropdown}>
                      <div className={styles.notificationHeader}>
                        <div>
                          <h2 className={styles.notificationTitle}>Notifications</h2>
                          <p className={styles.notificationSubtitle}>{unreadNotifications} unread updates</p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button type="button" className={styles.notificationAction} onClick={handleMarkAllAsRead}>Mark all read</button>
                          <span style={{ color: "var(--dashboard-border-soft)", fontSize: "12px" }}>|</span>
                          <button type="button" className={styles.notificationAction} style={{ color: "var(--dashboard-danger)" }} onClick={handleClearAll}>Clear all</button>
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
                              <span className={styles.notificationItemTitle}>{item.title}</span>
                              <span className={styles.notificationItemMeta}>{item.time}</span>
                            </span>
                          </button>
                        ))}
                        {notifications.length === 0 && (
                          <div className={styles.notificationEmpty}>No new notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search team members"
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>

                {/* Profile Dropdown */}
                <div className={styles.topOverlay} ref={profileRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isProfileOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Profile"
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationsOpen(false);
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <UserAvatar src={user?.avatar} name={user?.name} size={20} />
                  </button>
                  {isProfileOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileDropdownAvatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "none", borderRadius: "50%" }}>
                          <UserAvatar src={user?.avatar} name={user?.name} size={48} />
                        </div>
                        <div className={styles.profileDropdownInfo}>
                          <h4 className={styles.profileDropdownName}>{user?.name || "User Admin"}</h4>
                          <p className={styles.profileDropdownEmail}>{user?.email || "admin@example.com"}</p>
                          <span className={styles.profileDropdownRole}>{user?.role || "Administrator"}</span>
                        </div>
                      </div>
                      <div className={styles.profileDropdownLinks}>
                        <Link href="/dashboard/settings" className={styles.profileDropdownLink} onClick={() => setIsProfileOpen(false)}>
                          <i className="fas fa-cog"></i>
                          <span>Profile Settings</span>
                        </Link>
                        <Link href="/" className={styles.profileDropdownLink} onClick={() => setIsProfileOpen(false)}>
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
              <div className={styles.searchBar} ref={searchBarRef}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    className="bwp-search-field"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search team members..."
                    aria-label="Search team members"
                    autoFocus
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filteredTeam.length} result{filteredTeam.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {/* Main Content Area */}
            <main className={styles.content}>
              <header className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Team Members</h1>
                  <p className={styles.subtitle}>
                    Manage cards, profile pictures, bios, and social links for the About Us page.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.toolbarButtonPrimary}
                  onClick={() => {
                    setModalMode("add");
                    setModalForm({
                      id: "",
                      name: "",
                      role: "",
                      image: "",
                      bio: "",
                      socials: []
                    });
                    setModalError("");
                    setIsModalOpen(true);
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: "11px", marginRight: "6px" }}></i>
                  <span>Add Member</span>
                </button>
              </header>
              {/* Inline alerts removed in favor of floating toasts */}

              {isSaving && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--dashboard-text-soft)", marginBottom: "20px" }}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Syncing database settings...</span>
                </div>
              )}

              {/* Cards Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
                marginTop: "10px"
              }}>
                {filteredTeam.map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: "var(--dashboard-card-bg)",
                      border: "1px solid var(--dashboard-card-border)",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                      position: "relative",
                      transition: "transform 0.2s ease, border-color 0.2s ease"
                    }}
                  >
                    {/* Reordering indicators */}
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      display: "flex",
                      gap: "4px"
                    }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveMember(index, -1)}
                        style={{
                          background: "none",
                          border: "none",
                          color: index === 0 ? "var(--dashboard-text-muted)" : "var(--dashboard-text-soft)",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          opacity: index === 0 ? 0.3 : 0.8
                        }}
                        title="Move Up"
                      >
                        <i className="fas fa-arrow-left"></i>
                      </button>
                      <span style={{ fontSize: "11px", color: "var(--dashboard-text-muted)" }}>{index + 1}</span>
                      <button
                        type="button"
                        disabled={index === team.length - 1}
                        onClick={() => moveMember(index, 1)}
                        style={{
                          background: "none",
                          border: "none",
                          color: index === team.length - 1 ? "var(--dashboard-text-muted)" : "var(--dashboard-text-soft)",
                          cursor: index === team.length - 1 ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          opacity: index === team.length - 1 ? 0.3 : 0.8
                        }}
                        title="Move Down"
                      >
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>

                    {/* Avatar */}
                    <div style={{ marginBottom: "16px", marginTop: "8px" }}>
                      <UserAvatar src={member.image} name={member.name} size={80} />
                    </div>

                    {/* Info */}
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--dashboard-text)", margin: "0 0 4px" }}>
                      {member.name}
                    </h3>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "var(--dashboard-accent)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {member.role}
                    </div>

                    {member.bio ? (
                      <p style={{
                        fontSize: "13px",
                        color: "var(--dashboard-text-soft)",
                        margin: "0 0 16px",
                        lineHeight: "1.5",
                        maxHeight: "58px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical"
                      }}>
                        {member.bio}
                      </p>
                    ) : (
                      <p style={{ fontSize: "12px", fontStyle: "italic", color: "var(--dashboard-text-muted)", margin: "0 0 16px" }}>
                        No biography added.
                      </p>
                    )}

                    {/* Socials Check */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", marginRight: "4px" }}>Socials:</span>
                      {Array.isArray(member.socials) && member.socials.length > 0 ? (
                        member.socials.map((soc, sIdx) => {
                          const iconClass = getPlatformIcon(soc.platform);
                          return (
                            <i
                              key={sIdx}
                              className={iconClass}
                              style={{ color: soc.url ? "var(--dashboard-text-soft)" : "var(--dashboard-text-muted)", fontSize: "12px" }}
                              title={`${soc.platform}: ${soc.url || "Not set"}`}
                            />
                          );
                        })
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", fontStyle: "italic" }}>None</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: "flex",
                      width: "100%",
                      gap: "10px",
                      marginTop: "auto",
                      borderTop: "1px solid var(--dashboard-border-soft)",
                      paddingTop: "16px"
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setModalMode("edit");
                          setModalForm({
                            ...member,
                            socials: Array.isArray(member.socials) ? [...member.socials] : []
                          });
                          setModalError("");
                          setIsModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          height: "36px",
                          borderRadius: "8px",
                          border: "1px solid var(--dashboard-border-soft)",
                          backgroundColor: "transparent",
                          color: "var(--dashboard-text-soft)",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberToDelete(member);
                          setIsDeleteModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          height: "36px",
                          borderRadius: "8px",
                          border: "1px solid rgba(241,116,123,0.2)",
                          backgroundColor: "rgba(241,116,123,0.05)",
                          color: "#f1747b",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {team.length === 0 ? (
                  <div style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "var(--dashboard-card-bg)",
                    border: "1px dashed var(--dashboard-card-border)",
                    borderRadius: "16px",
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "var(--dashboard-text-muted)"
                  }}>
                    <i className="fas fa-user-friends" style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.4 }}></i>
                    <h3>No Team Members Found</h3>
                    <p style={{ fontSize: "13px", margin: "6px 0 16px 0" }}>Create team cards to display on the about us page.</p>
                    <button
                      type="button"
                      className={styles.toolbarButtonPrimary}
                      style={{ display: "inline-flex", margin: "0 auto" }}
                      onClick={() => {
                        setModalMode("add");
                        setModalForm({
                          id: "",
                          name: "",
                          role: "",
                          image: "",
                          bio: "",
                          socials: []
                        });
                        setModalError("");
                        setIsModalOpen(true);
                      }}
                    >
                      <i className="fas fa-plus" style={{ marginRight: "6px" }}></i>
                      <span>Add First Member</span>
                    </button>
                  </div>
                ) : (
                  filteredTeam.length === 0 && (
                    <div style={{
                      gridColumn: "1 / -1",
                      backgroundColor: "var(--dashboard-card-bg)",
                      border: "1px dashed var(--dashboard-card-border)",
                      borderRadius: "16px",
                      padding: "60px 20px",
                      textAlign: "center",
                      color: "var(--dashboard-text-muted)"
                    }}>
                      <i className="fas fa-search" style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.4 }}></i>
                      <h3>No Matching Members</h3>
                      <p style={{ fontSize: "13px", margin: "6px 0 0 0" }}>No team members match your search query: "{searchQuery}".</p>
                    </div>
                  )
                )}
              </div>
            </main>
          </div>

          {/* Add / Edit Modal */}
          {isModalOpen && (
            <div
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflowY: "auto",
                zIndex: 9999,
                padding: "24px 16px"
              }}
            >
              <div
                className={styles.thinScrollbar}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: "var(--dashboard-card-bg)",
                  border: "1px solid var(--dashboard-card-border)",
                  borderRadius: "18px",
                  width: "100%",
                  maxWidth: "500px",
                  maxHeight: "calc(100vh - 48px)",
                  overflowY: "auto",
                  margin: "0 auto",
                  padding: "24px",
                  boxShadow: "var(--dashboard-shadow)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--dashboard-text)", margin: 0 }}>
                    {modalMode === "add" ? "Add Team Member" : "Edit Team Member"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: "none", border: "none", color: "var(--dashboard-text-muted)", cursor: "pointer", fontSize: "16px" }}
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                {modalError && (
                  <div style={{ backgroundColor: "rgba(241,116,123,0.12)", border: "1px solid rgba(241,116,123,0.2)", borderRadius: "6px", color: "#f1747b", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Picture Upload Widget */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                    <div style={{ position: "relative", width: "64px", height: "64px" }}>
                      <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        border: "2px solid var(--dashboard-accent-soft)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent"
                      }}>
                        <UserAvatar src={modalForm.image} name={modalForm.name || "M"} size={64} />
                      </div>
                      <label htmlFor="team-avatar-upload-file" style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "var(--dashboard-accent)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        padding: 0,
                        margin: 0
                      }}>
                        <i className="fas fa-camera" style={{ fontSize: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 0 }} />
                        <input
                          type="file"
                          id="team-avatar-upload-file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                      {isUploading && (
                        <div style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 5
                        }}>
                          <i className="fas fa-spinner fa-spin" style={{ color: "#ffffff", fontSize: "14px" }}></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "var(--dashboard-text)" }}>Profile Photo</h4>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--dashboard-text-muted)" }}>Upload an image file (PNG, JPG).</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.name}
                      onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Ayesha Khan"
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        backgroundColor: "var(--dashboard-card-soft)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "6px",
                        color: "var(--dashboard-text)",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Role / Designation</label>
                    <input
                      type="text"
                      required
                      value={modalForm.role}
                      onChange={(e) => setModalForm(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g. Founder & Writer"
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        backgroundColor: "var(--dashboard-card-soft)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "6px",
                        color: "var(--dashboard-text)",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Image URL Fallback */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Or Photo URL</label>
                    <input
                      type="text"
                      value={modalForm.image}
                      onChange={(e) => setModalForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="e.g. /images/team-ayesha.png or https://example.com/pic.jpg"
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        backgroundColor: "var(--dashboard-card-soft)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "6px",
                        color: "var(--dashboard-text)",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Biography</label>
                    <textarea
                      value={modalForm.bio}
                      onChange={(e) => setModalForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write a brief profile description..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "var(--dashboard-card-soft)",
                        border: "1px solid var(--dashboard-border-soft)",
                        borderRadius: "6px",
                        color: "var(--dashboard-text)",
                        fontSize: "13px",
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {/* Socials Group */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Social Links</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(modalForm.socials || []).map((soc, index) => (
                        <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {/* Platform Select */}
                          <select
                            value={soc.platform}
                            onChange={(e) => {
                              const nextSocials = [...modalForm.socials];
                              nextSocials[index] = { ...nextSocials[index], platform: e.target.value };
                              setModalForm(prev => ({ ...prev, socials: nextSocials }));
                            }}
                            style={{
                              height: "36px",
                              padding: "0 8px",
                              backgroundColor: "var(--dashboard-card-soft)",
                              border: "1px solid var(--dashboard-border-soft)",
                              borderRadius: "6px",
                              color: "var(--dashboard-text)",
                              fontSize: "12px",
                              outline: "none",
                              width: "110px"
                            }}
                          >
                            <option value="x">X / Twitter</option>
                            <option value="instagram">Instagram</option>
                            <option value="pinterest">Pinterest</option>
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="github">GitHub</option>
                            <option value="youtube">YouTube</option>
                            <option value="email">Email</option>
                            <option value="website">Website</option>
                          </select>

                          {/* URL input */}
                          <input
                            type="text"
                            value={soc.url}
                            onChange={(e) => {
                              const nextSocials = [...modalForm.socials];
                              nextSocials[index] = { ...nextSocials[index], url: e.target.value };
                              setModalForm(prev => ({ ...prev, socials: nextSocials }));
                            }}
                            placeholder="Link URL (e.g. https://...)"
                            style={{
                              flex: 1,
                              height: "36px",
                              padding: "0 10px",
                              backgroundColor: "var(--dashboard-card-soft)",
                              border: "1px solid var(--dashboard-border-soft)",
                              borderRadius: "6px",
                              color: "var(--dashboard-text)",
                              fontSize: "12px",
                              outline: "none"
                            }}
                          />

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextSocials = modalForm.socials.filter((_, idx) => idx !== index);
                              setModalForm(prev => ({ ...prev, socials: nextSocials }));
                            }}
                            style={{
                              height: "36px",
                              width: "36px",
                              borderRadius: "6px",
                              border: "1px solid rgba(241,116,123,0.2)",
                              backgroundColor: "rgba(241,116,123,0.05)",
                              color: "#f1747b",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Remove link"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      ))}

                      {/* Add link button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSocials = [...(modalForm.socials || []), { platform: "x", url: "" }];
                          setModalForm(prev => ({ ...prev, socials: nextSocials }));
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          height: "36px",
                          width: "100%",
                          borderRadius: "6px",
                          border: "1px dashed var(--dashboard-card-border)",
                          backgroundColor: "transparent",
                          color: "var(--dashboard-text-soft)",
                          fontSize: "12px",
                          cursor: "pointer",
                          marginTop: "4px"
                        }}
                      >
                        <i className="fas fa-plus" style={{ fontSize: "10px" }}></i>
                        <span>Add Social Link</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={styles.toolbarButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.toolbarButtonPrimary}
                    >
                      {modalMode === "add" ? "Create Member" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && memberToDelete && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px"
            }}>
              <div style={{
                backgroundColor: "var(--dashboard-card-bg)",
                border: "1px solid rgba(241, 116, 123, 0.2)",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "400px",
                padding: "28px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)",
                textAlign: "center"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(241, 116, 123, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: "24px", color: "#f1747b" }} />
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--dashboard-text)", margin: "0 0 10px" }}>
                  Delete Team Member
                </h3>

                <p style={{ fontSize: "13.5px", color: "var(--dashboard-text-muted)", margin: "0 0 20px", lineHeight: "1.5" }}>
                  Are you sure you want to remove <strong style={{ color: "var(--dashboard-text)" }}>{memberToDelete.name}</strong> from the team? This action will remove their card from the about page.
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  marginTop: "24px"
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setMemberToDelete(null);
                    }}
                    className={styles.toolbarButton}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className={styles.toolbarButtonDanger}
                    style={{ flex: 1 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Toast Notifications */}
      {(successMessage || errorMessage) && (
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

          {successMessage && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-check-circle" style={{ color: "var(--dashboard-accent)" }}></i>
                </div>
                <div className="orin-toast-content">
                  {successMessage}
                </div>
                <button className="orin-toast-close" onClick={() => setSuccessMessage("")} aria-label="Close">
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

          {errorMessage && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-exclamation-circle" style={{ color: "#f43f5e" }}></i>
                </div>
                <div className="orin-toast-content" style={{ fontWeight: 500 }}>
                  {errorMessage}
                </div>
                <button className="orin-toast-close" onClick={() => setErrorMessage("")} aria-label="Close">
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
  );
}
