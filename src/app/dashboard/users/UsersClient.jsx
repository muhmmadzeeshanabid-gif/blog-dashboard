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
      month: "short",
      day: "numeric",
      year: "numeric",
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Users Management States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    email: "",
    role: "user",
    status: "active"
  });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

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
    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsModalOpen(false);
        setIsSearchOpen(false);
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

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      console.error("[Users] Delete user failed:", err);
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

    try {
      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalForm.name.trim(),
          email: modalForm.email.trim(),
          role: modalForm.role,
          avatar: `https://secure.gravatar.com/avatar/${Math.random().toString(36).substring(7)}?s=100&d=identicon`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setModalSuccess("User created successfully!");
        setModalForm({ name: "", email: "", role: "writer", status: "active" });
        fetchUsers(); // Refresh the list
        setTimeout(() => {
          setIsModalOpen(false);
          setModalSuccess("");
        }, 1200);
      } else {
        const errData = await res.json();
        setModalError(errData.error || "Failed to create user.");
      }
    } catch (err) {
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
                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search users"
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>
                <button type="button" className={styles.iconButton} aria-label="Profile">
                  <i className="fas fa-user"></i>
                </button>
              </div>
            </div>

            {isSearchOpen && (
              <div className={styles.searchBar}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users..."
                    aria-label="Search users"
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
                  onClick={() => setIsModalOpen(true)}
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: "40px",
                    padding: "0 14px",
                    backgroundColor: "var(--dashboard-card-bg)",
                    border: "1px solid var(--dashboard-border-soft)",
                    borderRadius: "8px",
                    color: "var(--dashboard-text)",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    width: "130px"
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                        <th style={thBase}>Role</th>
                        <th style={thBase}>Status</th>
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
                                <div style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--dashboard-card-soft)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                  fontSize: "14px",
                                  fontWeight: "700",
                                  color: "var(--dashboard-accent)"
                                }}>
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    u.name ? u.name[0].toUpperCase() : "U"
                                  )}
                                </div>
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
                                      : u.role === "writer"
                                      ? "rgba(16, 185, 129, 0.12)"
                                      : "rgba(59, 130, 246, 0.12)",
                                  color:
                                    u.role === "admin"
                                      ? "#8b5cf6"
                                      : u.role === "writer"
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
                              {formatDate(u.joinedAt)}
                            </td>
                            <td style={{ ...tdBase, textAlign: "right" }}>
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
                                  padding: "4px 8px",
                                  opacity: isSelf ? 0.5 : 1
                                }}
                              >
                                {u.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={isSelf}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: isSelf ? "not-allowed" : "pointer",
                                  color: "#f1747b",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  marginLeft: "10px",
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

      {/* Add User Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "var(--dashboard-card-bg)",
            border: "1px solid var(--dashboard-card-border)",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "480px",
            padding: "24px",
            boxShadow: "var(--dashboard-shadow)"
          }}>
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
                <select
                  value={modalForm.role}
                  onChange={(e) => setModalForm(prev => ({ ...prev, role: e.target.value }))}
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
                    cursor: "pointer"
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "transparent",
                    color: "var(--dashboard-text)",
                    border: "1px solid var(--dashboard-border-soft)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "var(--dashboard-accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
