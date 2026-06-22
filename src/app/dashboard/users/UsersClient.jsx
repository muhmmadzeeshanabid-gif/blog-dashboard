"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { DashboardSelect } from "../DashboardSelect";
import { useAuth } from "../../../lib/authContext";
import { useNotifications } from "../../../lib/notificationsContext";
import { useDashboardSettings } from "../layout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function toLocalDatetimeString(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000; // in ms
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Never";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}


function UserAvatar({ src, name, size = 36 }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const showInitials = !src || error || src.includes("00000000000000000000000000000000");

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
        userSelect: "none",
        flexShrink: 0,
        aspectRatio: "1/1"
      }}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
        aspectRatio: "1/1"
      }}
    />
  );
}

export default function UsersClient({ navItems, isDarkInitial, initialNotifications, initialLastUpdatedLabel }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { showSidebar: dbShowSidebar, sidebarPosition: dbSidebarPosition } = useDashboardSettings();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!dbShowSidebar);

  useEffect(() => {
    setIsSidebarCollapsed(!dbShowSidebar);
  }, [dbShowSidebar]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const searchBarRef = useRef(null);

  // Users Management States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExpiryInput, setShowExpiryInput] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    email: "",
    role: "editor",
    status: "active",
    password: "",
    expiresAt: ""
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editShowExpiryInput, setEditShowExpiryInput] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "editor",
    status: "active",
    avatar: "",
    password: "",
    expiresAt: ""
  });
  const [isUploadingEditAvatar, setIsUploadingEditAvatar] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Status/Feedback States
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [editModalError, setEditModalError] = useState("");
  const [editModalSuccess, setEditModalSuccess] = useState("");

  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const modalRoleOptions = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
  ];

  const editRoleOptions = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
  ];

  const userStatusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("[Users] Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        setIsSearchOpen(false);
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
      setIsNotificationsOpen(false);
      if (!next) {
        setSearchQuery("");
      }
      return next;
    });
  };



  // User Action Functions
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error("[Users] Update role failed:", err);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      console.error("[Users] Toggle status failed:", err);
    }
  };

  const handleDeleteUserClick = (u) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      console.error("[Users] Delete user failed:", err);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleEditClick = (u) => {
    setEditForm({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      avatar: u.avatar || "",
      password: u.role === "admin" ? (u.password || "") : generateRandomPassword(),
      expiresAt: u.expiresAt ? toLocalDatetimeString(u.expiresAt) : ""
    });
    setEditShowExpiryInput(!!u.expiresAt);
    setEditModalError("");
    setEditModalSuccess("");
    setIsEditModalOpen(true);
  };

  const handleEditAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setEditModalError("File is too large. Max size is 2MB.");
      return;
    }

    setIsUploadingEditAvatar(true);
    setEditModalError("");
    setEditModalSuccess("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEditForm(prev => ({ ...prev, avatar: data.avatarUrl }));
        setEditModalSuccess("Avatar uploaded successfully!");
      } else {
        const errorData = await res.json();
        setEditModalError(errorData.error || "Failed to upload avatar.");
      }
    } catch (err) {
      setEditModalError("Network error during upload.");
    } finally {
      setIsUploadingEditAvatar(false);
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditModalError("");
    setEditModalSuccess("");

    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditModalError("Name and Email cannot be empty.");
      return;
    }

    if (!editForm.password.trim()) {
      setEditModalError("Password cannot be empty.");
      return;
    }

    if (editForm.password.trim().length !== 6) {
      setEditModalError("Password must be exactly 6 characters.");
      return;
    }

    try {
      let isoExpiresAt = null;
      if (editShowExpiryInput && editForm.expiresAt) {
        const dateObj = new Date(editForm.expiresAt);
        if (!Number.isNaN(dateObj.getTime())) {
          isoExpiresAt = dateObj.toISOString();
        }
      }

      const res = await fetch(`/api/users/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          status: editForm.status,
          avatar: editForm.avatar,
          password: editForm.password.trim(),
          expiresAt: isoExpiresAt
        })
      });

      if (res.ok) {
        setEditModalSuccess("User updated successfully!");
        
        // Update local list
        setUsers(prev => prev.map(u => u.id === editForm.id ? { 
          ...u, 
          name: editForm.name.trim(), 
          email: editForm.email.trim(), 
          role: editForm.role, 
          status: editForm.status, 
          avatar: editForm.avatar,
          password: editForm.password.trim(),
          expiresAt: isoExpiresAt
        } : u));

        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditModalSuccess("");
        }, 1200);
      } else {
        const errText = await res.text();
        let errMsg = "Failed to update user.";
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch {
          console.error("[UsersClient] Server returned non-JSON response on edit:", errText);
        }
        setEditModalError(errMsg);
      }
    } catch (err) {
      console.error("[UsersClient] Error in handleEditUserSubmit:", err);
      setEditModalError("Server communication failed.");
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!modalForm.name.trim() || !modalForm.email.trim()) {
      setModalError("Please fill in both Name and Email.");
      return;
    }

    if (!modalForm.password.trim()) {
      setModalError("Password cannot be empty.");
      return;
    }

    if (modalForm.password.trim().length !== 6) {
      setModalError("Password must be exactly 6 characters.");
      return;
    }

    try {
      let isoExpiresAt = null;
      if (showExpiryInput && modalForm.expiresAt) {
        const dateObj = new Date(modalForm.expiresAt);
        if (!Number.isNaN(dateObj.getTime())) {
          isoExpiresAt = dateObj.toISOString();
        }
      }

      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalForm.name.trim(),
          email: modalForm.email.trim(),
          role: modalForm.role,
          password: modalForm.password.trim(),
          avatar: "",
          expiresAt: isoExpiresAt
        })
      });

      if (res.ok) {
        setModalSuccess("User created successfully!");
        setModalForm({ name: "", email: "", role: "editor", status: "active", password: "", expiresAt: "" });
        setShowExpiryInput(false);
        fetchUsers(); // Refresh the list
        setTimeout(() => {
          setIsModalOpen(false);
          setModalSuccess("");
        }, 1200);
      } else {
        const errText = await res.text();
        let errMsg = "Failed to create user.";
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch {
          console.error("[UsersClient] Server returned non-JSON response on create:", errText);
        }
        setModalError(errMsg);
      }
    } catch (err) {
      console.error("[UsersClient] Error in handleAddUserSubmit:", err);
      setModalError("Server communication failed.");
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const activeCount = users.filter(u => u.status === "active").length;
  const inactiveCount = users.filter(u => u.status === "inactive").length;
  const adminCount = users.filter(u => u.role === "admin").length;

  // Search & Filters
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === "all" ? true : u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const tdBase = { verticalAlign: "middle", padding: "14px 16px" };
  const thBase = {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--dashboard-text-muted)",
    borderBottom: "1px solid var(--dashboard-border-soft)",
    background: "var(--dashboard-card-soft)",
  };

  const isLeft = dbSidebarPosition === "left";
  const layoutClass = `${styles.layout} ${isLeft ? "" : styles.layoutRight} ${
    isSidebarCollapsed
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
            activeHref="/dashboard/users"
            sidebarPosition={dbSidebarPosition}
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
                  aria-label="Search users"
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
              <div className={styles.searchBar} ref={searchBarRef}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    className="bwp-search-field"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users..."
                    aria-label="Search users"
                    autoFocus
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <main className={styles.content}>
              <header className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Users</h1>
                  <p className={styles.subtitle}>
                    Manage users and their permissions.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.toolbarButtonPrimary}
                  onClick={() => {
                    setIsModalOpen(true);
                    setShowExpiryInput(false);
                    setModalForm({
                      name: "",
                      email: "",
                      role: "editor",
                      status: "active",
                      password: generateRandomPassword(),
                      expiresAt: ""
                    });
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: "11px", marginRight: "6px" }}></i>
                  <span>Add User</span>
                </button>
              </header>

              {/* Stats Cards */}
              <div className={styles.statsRow}>
                <section className={styles.statCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(111, 111, 255, 0.12)",
                      color: "var(--dashboard-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px"
                    }}>
                      <i className="fas fa-users" />
                    </div>
                    <div>
                      <h2 className={styles.statValue} style={{ fontSize: "20px", margin: 0 }}>{totalCount}</h2>
                      <p className={styles.statLabel} style={{ fontSize: "11px", margin: 0 }}>Total Users</p>
                    </div>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px"
                    }}>
                      <i className="fas fa-user-check" />
                    </div>
                    <div>
                      <h2 className={styles.statValue} style={{ fontSize: "20px", margin: 0 }}>{activeCount}</h2>
                      <p className={styles.statLabel} style={{ fontSize: "11px", margin: 0 }}>Active</p>
                    </div>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px"
                    }}>
                      <i className="fas fa-user-slash" />
                    </div>
                    <div>
                      <h2 className={styles.statValue} style={{ fontSize: "20px", margin: 0 }}>{inactiveCount}</h2>
                      <p className={styles.statLabel} style={{ fontSize: "11px", margin: 0 }}>Inactive</p>
                    </div>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(139, 92, 246, 0.12)",
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px"
                    }}>
                      <i className="fas fa-user-shield" />
                    </div>
                    <div>
                      <h2 className={styles.statValue} style={{ fontSize: "20px", margin: 0 }}>{adminCount}</h2>
                      <p className={styles.statLabel} style={{ fontSize: "11px", margin: 0 }}>Admins</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Toolbar search & filters */}
              <div style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "20px",
                alignItems: "center",
                justifyContent: "flex-end"
              }}>
                <div style={{ width: "160px" }}>
                  <DashboardSelect
                    inputId="users-status-filter"
                    value={statusFilterOptions.find((option) => option.value === statusFilter) || null}
                    onChange={(option) => setStatusFilter(option?.value || "all")}
                    options={statusFilterOptions}
                    minHeight={40}
                    borderRadius={8}
                    fontSize={13}
                    controlBackground="var(--dashboard-card-bg)"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className={styles.tableCard} style={{ overflowX: "auto" }}>
                {loadingUsers ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--dashboard-text-muted)" }}>
                    <div style={{
                      width: "30px",
                      height: "30px",
                      border: "2px solid rgba(255,255,255,0.1)",
                      borderTop: "2px solid var(--dashboard-accent)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 10px"
                    }} />
                    <span>Fetching users database...</span>
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                    <thead>
                      <tr>
                        <th style={thBase}>User</th>
                        <th style={thBase}>Email</th>
                        <th style={thBase}>Password</th>
                        <th style={thBase}>Role</th>
                        <th style={thBase}>Status</th>
                        <th style={thBase}>Expires</th>
                        <th style={thBase}>Joined</th>
                        <th style={{ ...thBase, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSelf = u.email === user?.email;
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--dashboard-border-soft)" }}>
                            <td style={tdBase}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <UserAvatar src={u.avatar} name={u.name} size={36} />
                                <div>
                                  <strong style={{ fontSize: "13px", color: "var(--dashboard-text)", display: "block" }}>
                                    {u.name}
                                    {isSelf && <span style={{ marginLeft: "6px", fontSize: "10px", padding: "2px 6px", background: "var(--dashboard-accent-soft)", color: "var(--dashboard-accent)", borderRadius: "10px" }}>You</span>}
                                  </strong>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...tdBase, fontSize: "13px", color: "var(--dashboard-text-soft)" }}>
                              {u.email}
                            </td>
                            <td style={{ ...tdBase, fontSize: "13px", fontFamily: "monospace", color: "var(--dashboard-text-soft)" }}>
                              {u.password || "—"}
                            </td>
                            <td style={tdBase}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                  backgroundColor:
                                    u.role === "admin"
                                      ? "rgba(139, 92, 246, 0.12)"
                                      : u.role === "editor" || u.role === "writer"
                                      ? "rgba(16, 185, 129, 0.12)"
                                      : "rgba(59, 130, 246, 0.12)",
                                  color:
                                    u.role === "admin"
                                      ? "#8b5cf6"
                                      : u.role === "editor" || u.role === "writer"
                                      ? "#10b981"
                                      : "#3b82f6",
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={tdBase}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: u.status === "active" ? "#10b981" : "#9898a4"
                                }} />
                                <span style={{
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: u.status === "active" ? "#10b981" : "var(--dashboard-text-muted)"
                                }}>
                                  {u.status === "active" ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </td>
                            <td style={{ ...tdBase, fontSize: "12px", color: "var(--dashboard-text-muted)" }}>
                              {u.expiresAt ? (
                                <span style={{
                                  color: new Date(u.expiresAt) < new Date() ? "#f1747b" : "var(--dashboard-text-soft)",
                                  fontWeight: new Date(u.expiresAt) < new Date() ? "600" : "normal"
                                }}>
                                  {formatDateTime(u.expiresAt)}
                                  {new Date(u.expiresAt) < new Date() && " (Expired)"}
                                </span>
                              ) : (
                                "Never"
                              )}
                            </td>
                            <td style={{ ...tdBase, fontSize: "12px", color: "var(--dashboard-text-muted)" }}>
                              {formatDate(u.joinedAt)}
                            </td>
                            <td style={{ ...tdBase, textAlign: "right" }}>
                              <button
                                onClick={() => handleEditClick(u)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--dashboard-accent)",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  padding: "4px 8px"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                disabled={isSelf}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: isSelf ? "not-allowed" : "pointer",
                                  color: u.status === "active" ? "#f59e0b" : "#10b981",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  marginLeft: "6px",
                                  padding: "4px 8px",
                                  opacity: isSelf ? 0.5 : 1
                                }}
                              >
                                {u.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteUserClick(u)}
                                disabled={isSelf}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: isSelf ? "not-allowed" : "pointer",
                                  color: "#f1747b",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  marginLeft: "6px",
                                  padding: "4px 8px",
                                  opacity: isSelf ? 0.5 : 1
                                }}
                                title="Delete User"
                              >
                                <i className="fas fa-trash-alt" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--dashboard-text-muted)" }}>
                            No users matched your selection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

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
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--dashboard-card-bg)",
              border: "1px solid var(--dashboard-card-border)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "var(--dashboard-shadow)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--dashboard-text)", margin: 0 }}>Add New User</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalError("");
                  setModalSuccess("");
                }}
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

            {modalSuccess && (
              <div style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", color: "#10b981", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
                <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={modalForm.name}
                  onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
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

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. jane.doe@email.com"
                  value={modalForm.email}
                  onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
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

               <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Account Role</label>
                <DashboardSelect
                  inputId="users-create-role"
                  value={modalRoleOptions.find((option) => option.value === modalForm.role) || null}
                  onChange={(option) => {
                    const nextRole = option?.value || "editor";
                    setModalForm(prev => {
                      const nextPassword = nextRole === "admin" ? "" : (prev.role === "admin" ? generateRandomPassword() : (prev.password || generateRandomPassword()));
                      return { ...prev, role: nextRole, password: nextPassword };
                    });
                  }}
                  options={modalRoleOptions}
                  minHeight={40}
                  borderRadius={6}
                  fontSize={13}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Password</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder={modalForm.role === "admin" ? "Enter admin password (6 chars)" : "Auto-generated password"}
                    value={modalForm.password}
                    maxLength={6}
                    onChange={(e) => setModalForm(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      flex: 1,
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
                  {modalForm.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, password: generateRandomPassword() }))}
                      className={styles.toolbarButton}
                      style={{ height: "40px", padding: "0 14px", minHeight: "unset", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Regenerate password"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="set-expiry"
                  checked={showExpiryInput}
                  onChange={(e) => {
                    setShowExpiryInput(e.target.checked);
                    if (!e.target.checked) {
                      setModalForm(prev => ({ ...prev, expiresAt: "" }));
                    }
                  }}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
                <label htmlFor="set-expiry" style={{ fontSize: "12px", color: "var(--dashboard-text)", cursor: "pointer", userSelect: "none" }}>
                  Set Access Expiration Date
                </label>
              </div>

              {showExpiryInput && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Access Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    value={modalForm.expiresAt || ""}
                    onChange={(e) => setModalForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      backgroundColor: "var(--dashboard-card-soft)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "6px",
                      color: "var(--dashboard-text)",
                      fontSize: "13px",
                      outline: "none",
                      colorScheme: isDark ? "dark" : "light"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div 
          onClick={() => {
            setIsEditModalOpen(false);
            setEditModalError("");
            setEditModalSuccess("");
          }}
          style={{
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
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--dashboard-card-bg)",
              border: "1px solid var(--dashboard-card-border)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "var(--dashboard-shadow)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--dashboard-text)", margin: 0 }}>Edit User</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditModalError("");
                  setEditModalSuccess("");
                }}
                style={{ background: "none", border: "none", color: "var(--dashboard-text-muted)", cursor: "pointer", fontSize: "16px" }}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {editModalError && (
              <div style={{ backgroundColor: "rgba(241,116,123,0.12)", border: "1px solid rgba(241,116,123,0.2)", borderRadius: "6px", color: "#f1747b", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
                {editModalError}
              </div>
            )}

            {editModalSuccess && (
              <div style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", color: "#10b981", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
                <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
                {editModalSuccess}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Profile image edit within modal */}
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
                    <UserAvatar src={editForm.avatar} name={editForm.name} size={64} />
                  </div>
                  <label htmlFor="edit-avatar-upload-file" style={{
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
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                  }}>
                    <i className="fas fa-camera" style={{ fontSize: "10px" }} />
                    <input
                      type="file"
                      id="edit-avatar-upload-file"
                      accept="image/*"
                      onChange={handleEditAvatarUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                  {isUploadingEditAvatar && (
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
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "var(--dashboard-text)" }}>User Avatar</h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--dashboard-text-muted)" }}>Upload profile photo.</p>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
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

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Account Role</label>
                <DashboardSelect
                  inputId="users-edit-role"
                  value={editRoleOptions.find((option) => option.value === editForm.role) || null}
                  onChange={(option) => {
                    const nextRole = option?.value || "editor";
                    setEditForm(prev => {
                      const nextPassword = nextRole === "admin" ? "" : (prev.role === "admin" ? generateRandomPassword() : prev.password);
                      return { ...prev, role: nextRole, password: nextPassword };
                    });
                  }}
                  options={editRoleOptions}
                  minHeight={40}
                  borderRadius={6}
                  fontSize={13}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Password</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder={editForm.role === "admin" ? "Enter admin password (6 chars)" : "Enter or generate password"}
                    value={editForm.password}
                    maxLength={6}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      flex: 1,
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
                  {editForm.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, password: generateRandomPassword() }))}
                      className={styles.toolbarButton}
                      style={{ height: "40px", padding: "0 14px", minHeight: "unset", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Regenerate password"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Status</label>
                <DashboardSelect
                  inputId="users-edit-status"
                  value={userStatusOptions.find((option) => option.value === editForm.status) || null}
                  onChange={(option) => setEditForm(prev => ({ ...prev, status: option?.value || "active" }))}
                  options={userStatusOptions}
                  minHeight={40}
                  borderRadius={6}
                  fontSize={13}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="edit-set-expiry"
                  checked={editShowExpiryInput}
                  onChange={(e) => {
                    setEditShowExpiryInput(e.target.checked);
                    if (!e.target.checked) {
                      setEditForm(prev => ({ ...prev, expiresAt: "" }));
                    }
                  }}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
                <label htmlFor="edit-set-expiry" style={{ fontSize: "12px", color: "var(--dashboard-text)", cursor: "pointer", userSelect: "none" }}>
                  Set Access Expiration Date
                </label>
              </div>

              {editShowExpiryInput && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--dashboard-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Access Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.expiresAt || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      backgroundColor: "var(--dashboard-card-soft)",
                      border: "1px solid var(--dashboard-border-soft)",
                      borderRadius: "6px",
                      color: "var(--dashboard-text)",
                      fontSize: "13px",
                      outline: "none",
                      colorScheme: isDark ? "dark" : "light"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.toolbarButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.toolbarButtonPrimary}
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
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
            maxWidth: "440px",
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

            <h3 style={{ fontSize: "19px", fontWeight: "700", color: "var(--dashboard-text)", margin: "0 0 10px" }}>
              Delete Account
            </h3>
            
            <p style={{ fontSize: "14px", color: "var(--dashboard-text-muted)", margin: "0 0 20px", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete the account for <strong style={{ color: "var(--dashboard-text)" }}>{userToDelete.name || userToDelete.email}</strong>? This action is irreversible.
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
                  setUserToDelete(null);
                }}
                className={styles.toolbarButton}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                disabled={isDeletingUser}
                className={styles.toolbarButtonDanger}
                style={{
                  flex: 1,
                  cursor: isDeletingUser ? "not-allowed" : "pointer",
                }}
              >
                {isDeletingUser ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
