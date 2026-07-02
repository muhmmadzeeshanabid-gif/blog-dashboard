"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "@/dashboard/components/dashboard.module.css";
import localStyles from "./messages.module.css";
import Sidebar from "@/dashboard/components/Sidebar";
import { useAuth } from "@/frontend/lib/authContext";
import { useNotifications } from "@/dashboard/lib/notificationsContext";
import { getAccentCookie, applyAccent } from "@/frontend/lib/accentTheme";

import { useDashboardSettings } from "../layout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
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

function formatShortDateTime(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    
    // If today, show e.g. "10:35 AM"
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    
    // If this year, show e.g. "Jul 2"
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function UserAvatar({ src, name, size = 40 }) {
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

export default function MessagesClient({
  navItems,
  isDarkInitial,
  initialNotifications,
}) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSettings();
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();

  // Navigation states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Messages states
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("orin_read_message_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const searchBarRef = useRef(null);

  // Fetch messages from API
  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to load messages.");
      }
    } catch (err) {
      setError("Failed to fetch messages. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Handle URL ID query parameter to auto-select a message
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const messageId = params.get("id");
      if (messageId && messages.length > 0) {
        const exists = messages.some((msg) => msg.id === messageId);
        if (exists) {
          setSelectedMessageId(messageId);
        }
      }
    }
  }, [messages]);

  // Handle instant notification clicks when already on the messages page
  useEffect(() => {
    const handleInstantSelect = (e) => {
      const messageId = e.detail?.id;
      if (messageId) {
        setSelectedMessageId(messageId);
      }
    };
    window.addEventListener("orin-message-selected", handleInstantSelect);
    return () => window.removeEventListener("orin-message-selected", handleInstantSelect);
  }, []);

  // Theme Syncing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const body = document.body;
      if (isDark) {
        body.classList.add("bwp-dark-style");
      } else {
        body.classList.remove("bwp-dark-style");
      }
      setThemeCookie(isDark);

      const currentAccent = getAccentCookie();
      applyAccent(currentAccent);
    }
  }, [isDark]);

  // Click outside handling for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        // Only close if we are not clicking the toggle button
        const toggleBtn = document.getElementById("search-toggle-btn");
        if (toggleBtn && !toggleBtn.contains(e.target)) {
          setIsSearchOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileOpen(false);
    setIsSearchOpen(false);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  // Delete message API call
  const handleDeleteMessage = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/contact?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
        if (selectedMessageId === id) {
          setSelectedMessageId(null);
        }
        setDeleteConfirmId(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete message.");
      }
    } catch (err) {
      alert("Error occurred while deleting message.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort logic
  const filteredMessages = messages
    .filter((msg) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      if (sortBy === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

  const selectedMessage = messages.find((msg) => msg.id === selectedMessageId);

  // Handle saving reply and opening mail app
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/contact/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyText: replyText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Add new reply to messages state locally
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === selectedMessage.id) {
              return {
                ...msg,
                replies: [...(msg.replies || []), data.data],
              };
            }
            return msg;
          })
        );

        // Open the email client with filled subject and body
        const mailtoUrl = `mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}&body=${encodeURIComponent(replyText.trim())}`;
        window.open(mailtoUrl, "_blank");

        setIsReplying(false);
        setReplyText("");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save reply.");
      }
    } catch (err) {
      alert("Error occurred while saving reply.");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/messages"
          />

          <div className={styles.mainWrapper}>
            {/* Topbar navigation */}
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
                  id="search-toggle-btn"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search messages"
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
                    style={{ display: "flex", alignItems: "center", justifyItems: "center" }}
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
                          <h4 className={styles.profileDropdownName}>{user?.name || "Admin"}</h4>
                          <p className={styles.profileDropdownEmail}>{user?.email || ""}</p>
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

            {/* Search Subbar (when toggled active) */}
            {isSearchOpen && (
              <div className={styles.searchBar} ref={searchBarRef}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    className="bwp-search-field"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    aria-label="Search messages"
                    autoFocus
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filteredMessages.length} message{filteredMessages.length === 1 ? "" : "s"} found
                </span>
              </div>
            )}

            {/* Main content body */}
            <main className={styles.content}>
              <header className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Contact Messages</h1>
                  <p className={styles.subtitle}>
                    View and manage user requests submitted from the Contact Us form.
                  </p>
                </div>
              </header>

              {loading ? (
                <div className={localStyles.loadingOverlay}>
                  <div className={localStyles.spinner} />
                  <span>Loading messages...</span>
                </div>
              ) : error ? (
                <div className={localStyles.emptyList}>
                  <i className="fas fa-exclamation-circle" style={{ color: "var(--dashboard-danger)" }} />
                  <p>{error}</p>
                  <button onClick={fetchMessages} className={`${localStyles.btn} ${localStyles.btnPrimary}`} style={{ marginTop: "10px" }}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className={`${localStyles.container} ${selectedMessageId ? localStyles.containerActiveDetail : ""}`}>

                  {/* Left Messages List Pane */}
                  <div className={localStyles.listPanel}>
                    <div className={localStyles.searchBar}>
                      <div className={localStyles.searchTopRow}>
                        <div className={styles.searchField} style={{ flex: 1, height: "42px", borderRadius: "8px" }}>
                          <i className="fas fa-search" />
                          <input
                            type="text"
                            className="bwp-search-field"
                            placeholder="Search sender, subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ fontSize: "13px" }}
                          />
                        </div>
                        <select
                          className={localStyles.sortSelect}
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                      </div>
                      <div className={localStyles.filterRow}>
                        <span className={localStyles.resultsCount}>
                          {filteredMessages.length} message{filteredMessages.length === 1 ? "" : "s"}
                          {(() => { const unread = filteredMessages.filter(m => !readIds.has(m.id)).length; return unread > 0 ? <span className={localStyles.unreadBadge}>{unread} unread</span> : null; })()}
                        </span>
                      </div>
                    </div>

                    <div className={localStyles.messageList}>
                      {filteredMessages.map((msg) => {
                        const isActive = msg.id === selectedMessageId;
                        const isUnread = !readIds.has(msg.id);
                        return (
                          <div
                            key={msg.id}
                            className={`${localStyles.messageCard} ${isActive ? localStyles.messageCardActive : ""} ${isUnread ? localStyles.messageCardUnread : ""}`}
                            onClick={() => {
                              setSelectedMessageId(msg.id);
                              if (isUnread) {
                                setReadIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(msg.id);
                                  try { localStorage.setItem("orin_read_message_ids", JSON.stringify([...next])); } catch { }
                                  return next;
                                });
                              }
                            }}
                          >
                            {isUnread && <span className={localStyles.unreadDot} />}
                            <div className={localStyles.avatarWrapper}>
                              <UserAvatar name={msg.name} size={38} />
                            </div>
                            <div className={localStyles.cardContent}>
                              <div className={localStyles.cardHeader}>
                                <span className={`${localStyles.senderName} ${isUnread ? localStyles.senderNameUnread : ""}`}>
                                  {msg.name}
                                </span>
                                <div className={localStyles.actionWrapper}>
                                  <span className={localStyles.messageDate}>{formatShortDateTime(msg.submittedAt)}</span>
                                  <button
                                    type="button"
                                    className={localStyles.cardDeleteBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmId(msg.id);
                                    }}
                                    title="Delete Message"
                                  >
                                    <i className="far fa-trash-alt" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredMessages.length === 0 && (
                        <div className={localStyles.emptyList}>
                          <i className="far fa-envelope-open" />
                          <span>No messages found</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Reader Detail Pane */}
                  <div className={localStyles.detailPanel}>
                    {selectedMessage ? (
                      <div className={localStyles.detailContent}>

                        {/* Mobile Back Button */}
                        <button
                          type="button"
                          className={localStyles.mobileBackBtn}
                          onClick={() => setSelectedMessageId(null)}
                        >
                          <i className="fas fa-arrow-left" /> Back to list
                        </button>

                        <div className={localStyles.detailHeaderSection}>
                          <div className={localStyles.detailMetaRow}>
                            <UserAvatar name={selectedMessage.name} size={48} />
                            <div className={localStyles.detailSenderInfo}>
                              <h2 className={localStyles.detailSenderName}>{selectedMessage.name}</h2>
                              <a
                                href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}`}
                                className={localStyles.detailSenderEmail}
                              >
                                <i className="fas fa-envelope" style={{ marginRight: "6px" }} />
                                {selectedMessage.email}
                              </a>
                            </div>
                            <div className={localStyles.detailDate} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span>{formatDateTime(selectedMessage.submittedAt)}</span>
                              <button
                                type="button"
                                className={localStyles.deleteTopBtn}
                                onClick={() => setDeleteConfirmId(selectedMessage.id)}
                                title="Delete message"
                              >
                                <i className="fas fa-trash-alt" />
                              </button>
                              <button
                                type="button"
                                className={localStyles.closeBtn}
                                onClick={() => setSelectedMessageId(null)}
                                title="Close reader"
                              >
                                <i className="fas fa-times" />
                              </button>
                            </div>
                          </div>
                          <h3 className={localStyles.detailSubject}>Subject: {selectedMessage.subject}</h3>
                        </div>

                        <div className={localStyles.detailMessageLabel}>Message:</div>
                        <div className={localStyles.detailBody}>
                          {selectedMessage.message}
                        </div>

                        <div className={localStyles.detailCaptchaRow}>
                          <span><strong>Answer:</strong> {(selectedMessage.captchaQuestion || "32+25=?").replace("=?", "")} = {selectedMessage.captchaAnswer || "57"}</span>
                        </div>

                        {/* Thread of Replies */}
                        {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                          <div className={localStyles.repliesSection}>
                            <div className={localStyles.repliesTitle}>Previous Replies</div>
                            <div className={localStyles.repliesList}>
                              {selectedMessage.replies.map((reply) => (
                                <div key={reply.id} className={localStyles.replyBubble}>
                                  <div className={localStyles.replyHeader}>
                                    <span className={localStyles.replyAuthor}>
                                      <i className="fas fa-reply-all" style={{ marginRight: "6px", color: "var(--dashboard-accent)" }} />
                                      Replied by {reply.repliedBy}
                                    </span>
                                    <span className={localStyles.replyDate}>{formatDateTime(reply.repliedAt)}</span>
                                  </div>
                                  <div className={localStyles.replyText}>{reply.text}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className={localStyles.blankState}>
                        <i className={`far fa-envelope-open ${localStyles.blankStateIcon}`} />
                        <h2 className={localStyles.blankStateTitle}>Your Inbox is Clear</h2>
                        <p className={localStyles.blankStateDesc}>
                          Select a contact request from the left pane list to read its full message details, reply to customers, or manage submissions.
                        </p>
                        {messages.length > 0 && (
                          <div className={localStyles.unreadBadge} style={{ marginTop: "10px", padding: "6px 16px", fontSize: "12px" }}>
                            {messages.filter(m => !readIds.has(m.id)).length} unread message{messages.filter(m => !readIds.has(m.id)).length === 1 ? "" : "s"} waiting
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className={localStyles.confirmOverlay} onClick={() => setDeleteConfirmId(null)}>
          <div className={localStyles.confirmContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={localStyles.confirmTitle}>Delete Message?</h3>
            <p className={localStyles.confirmDesc}>
              Are you sure you want to delete this message? This action is permanent and cannot be undone.
            </p>
            <div className={localStyles.confirmActions}>
              <button
                type="button"
                className={`${localStyles.btn} ${localStyles.btnSecondary}`}
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${localStyles.btn} ${localStyles.btnDanger}`}
                onClick={() => handleDeleteMessage(deleteConfirmId)}
                disabled={deleting}
                style={{ minWidth: "80px" }}
              >
                {deleting ? <div className={localStyles.spinner} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
