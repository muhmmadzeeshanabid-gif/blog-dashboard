"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { useAuth } from "../../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function PostsClient({ initialPosts, navItems, isDarkInitial }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialPosts.filters.query));
  const [searchQuery, setSearchQuery] = useState(initialPosts.filters.query);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [postsData, setPostsData] = useState(initialPosts);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openActionPostId, setOpenActionPostId] = useState(null);
  const [isDeletingPostId, setIsDeletingPostId] = useState(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      const params = new URLSearchParams(window.location.search);
      fetch(`/api/dashboard/posts?${params.toString()}`, {
        cache: "no-store",
      })
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) {
            setPostsData(data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
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
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsFilterMenuOpen(false);
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

      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }

      if (
        event.target instanceof Element &&
        !event.target.closest("[data-post-row-actions]")
      ) {
        setOpenActionPostId(null);
      }
    };

    window.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("mousedown", onDocumentMouseDown);

    return () => {
      window.removeEventListener("keydown", onDocumentKeyDown);
      window.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  const applyPostsParams = async (nextSearch) => {
    const params = new URLSearchParams();

    if (nextSearch.page && nextSearch.page !== 1) {
      params.set("page", String(nextSearch.page));
    }

    if (nextSearch.status && nextSearch.status !== "all") {
      params.set("status", nextSearch.status);
    }

    if (nextSearch.query) {
      params.set("query", nextSearch.query);
    }

    const query = params.toString();
    const url = query ? `/dashboard/posts?${query}` : "/dashboard/posts";

    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/dashboard/posts?${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextPosts = await response.json();
      window.history.replaceState({}, "", url);
      setPostsData(nextPosts);
      setSearchQuery(nextPosts.filters.query);
      setIsFilterMenuOpen(false);
      setOpenActionPostId(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refreshPosts = async () => {
      try {
        const response = await fetch(`/api/dashboard/posts?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const nextPosts = await response.json();
        setPostsData(nextPosts);
      } catch {
        return;
      }
    };

    const intervalId = window.setInterval(refreshPosts, 45000);
    return () => window.clearInterval(intervalId);
  }, [postsData.filters.query, postsData.filters.status, postsData.pagination.page]);

  useEffect(() => {
    const debouncedId = window.setTimeout(() => {
      const normalizedQuery = searchQuery.trim();
      if (normalizedQuery === postsData.filters.query) {
        return;
      }

      applyPostsParams({
        page: 1,
        status: postsData.filters.status,
        query: normalizedQuery,
      });
    }, 260);

    return () => window.clearTimeout(debouncedId);
  }, [searchQuery, postsData.filters.query, postsData.filters.status]);

  const notifications = (postsData.notifications ?? []).map((item) => ({
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

  const handleSearchToggle = async () => {
    const nextValue = !isSearchOpen;
    setIsSearchOpen(nextValue);
    setIsNotificationsOpen(false);
    setIsFilterMenuOpen(false);

    if (!nextValue && (searchQuery || postsData.filters.query)) {
      setSearchQuery("");
      await applyPostsParams({
        page: 1,
        status: postsData.filters.status,
        query: "",
      });
    }
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => {
      const next = !current;
      if (next) {
        setIsSearchOpen(false);
        setIsFilterMenuOpen(false);
      }
      return next;
    });
  };

  const handleFilterToggle = () => {
    setIsFilterMenuOpen((current) => {
      const next = !current;
      if (next) {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
      return next;
    });
  };

  const handleFilterSelect = async (status) => {
    await applyPostsParams({
      page: 1,
      status,
      query: postsData.filters.query,
    });
  };

  const handlePageChange = async (page) => {
    if (page < 1 || page > postsData.pagination.totalPages) {
      return;
    }

    await applyPostsParams({
      page,
      status: postsData.filters.status,
      query: postsData.filters.query,
    });
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  const handleClearAll = () => {
    setPostsData((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  const handleNotificationClick = (notificationId) => {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId]
    );
  };

  const handleExport = () => {
    const rows = postsData.items.map((post) => ({
      Title: post.title,
      Category: post.category,
      Status: post.statusLabel,
      Author: post.author,
      Date: post.date,
      Views: post.views,
    }));
    const header = Object.keys(rows[0] ?? {
      Title: "",
      Category: "",
      Status: "",
      Author: "",
      Date: "",
      Views: "",
    });
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header.map((key) => `"${String(row[key]).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const fileUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = "orin-posts.csv";
    anchor.click();
    URL.revokeObjectURL(fileUrl);
  };

  const handleDeletePost = async (post) => {
    const shouldDelete = window.confirm(
      `Delete "${post.title}"? This will remove it from the dashboard and homepage.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingPostId(post.id);

    try {
      const response = await fetch(`/api/dashboard/posts/${post.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      await applyPostsParams({
        page: postsData.pagination.page,
        status: postsData.filters.status,
        query: postsData.filters.query,
      });
    } finally {
      setIsDeletingPostId(null);
      setOpenActionPostId(null);
    }
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/posts"
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
              aria-label="Search posts"
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
                placeholder="Search posts, categories or author..."
                aria-label="Search posts"
              />
            </div>
            <span className={styles.searchMeta}>
              {postsData.pagination.totalItems} result
              {postsData.pagination.totalItems === 1 ? "" : "s"}
            </span>
          </div>
        )}

          <main className={styles.content}>
            <div className={styles.headingRow}>
              <div>
                <h1 className={styles.title}>Posts</h1>
                <p className={styles.subtitle}>
                  Manage and organize your blog posts with live dashboard data.
                </p>
                <p className={styles.lastUpdated}>
                  {isRefreshing ? "Refreshing data..." : `Updated ${postsData.meta.lastUpdatedLabel}`}
                </p>
              </div>

              <div className={styles.pageActions}>
                <div className={styles.actionOverlay} ref={filterMenuRef}>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={handleFilterToggle}
                    aria-expanded={isFilterMenuOpen}
                  >
                    <i className="fas fa-filter"></i>
                    <span>Filter</span>
                  </button>

                  {isFilterMenuOpen && (
                    <div className={styles.filterDropdown}>
                      <p className={styles.filterLabel}>Show posts</p>
                      <div className={styles.filterOptionList}>
                        {postsData.filters.options.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={`${styles.filterOptionButton} ${postsData.filters.status === option.key ? styles.filterOptionButtonActive : ""}`}
                            onClick={() => handleFilterSelect(option.key)}
                          >
                            <span>{option.label}</span>
                            <strong>{postsData.filters.totals[option.key]}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={handleExport}
                >
                  <i className="fas fa-file-export"></i>
                  <span>Export</span>
                </button>

                <Link
                  href="/dashboard/posts/new"
                  className={styles.toolbarButtonPrimary}
                >
                  <i className="fas fa-plus"></i>
                  <span>New Post</span>
                </Link>
              </div>
            </div>

            <section className={styles.panel}>
              <div className={styles.postsPanelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Posts</h2>
                  <p className={styles.postsPanelMeta}>
                    Showing {postsData.pagination.startItem}-{postsData.pagination.endItem} of{" "}
                    {postsData.pagination.totalItems} posts
                  </p>
                </div>
                <div className={styles.postsStatusChip}>
                  {postsData.filters.status === "all"
                    ? "All statuses"
                    : postsData.filters.status === "published"
                      ? "Published only"
                      : "Drafts only"}
                </div>
              </div>

              <div className={styles.postsTableWrap}>
                <div className={styles.postsTableHeader}>
                  <span>Title</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Author</span>
                  <span>Date</span>
                  <span>Views</span>
                  <span>Action</span>
                </div>

                <div className={styles.postsTableBody}>
                  {postsData.items.map((post) => (
                    <article key={post.id} className={styles.postsTableRow}>
                      <div className={styles.postTitleCell}>
                        <div className={styles.postThumb}>
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes="56px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className={styles.postTitleMeta}>
                          <strong>{post.title}</strong>
                          <span>{post.slug}</span>
                        </div>
                      </div>
                      <span className={styles.postsCellMuted}>{post.category}</span>
                      <span>
                        <span
                          className={
                            post.status === "published"
                              ? styles.statusBadgePublished
                              : styles.statusBadgeDraft
                          }
                        >
                          {post.statusLabel}
                        </span>
                      </span>
                      <span className={styles.postsCellMuted}>{post.author}</span>
                      <span className={styles.postsCellMuted}>{post.date}</span>
                      <span className={styles.postsCellMuted}>{post.views}</span>
                      <div className={styles.rowActionWrap} data-post-row-actions="true">
                        <button
                          type="button"
                          className={styles.rowActionButton}
                          aria-label={`Manage ${post.title}`}
                          title="More actions"
                          onClick={() =>
                            setOpenActionPostId((currentId) =>
                              currentId === post.id ? null : post.id
                            )
                          }
                        >
                          <i className="fas fa-ellipsis-h"></i>
                        </button>

                        {openActionPostId === post.id && (
                          <div className={styles.rowActionMenu}>
                            <Link
                              href={`/dashboard/posts/new?slug=${post.slug}`}
                              className={styles.rowActionLink}
                            >
                              <i className="fas fa-pen"></i>
                              <span>Edit post</span>
                            </Link>
                            <button
                              type="button"
                              className={`${styles.rowActionLink} ${styles.rowActionLinkDanger}`}
                              onClick={() => handleDeletePost(post)}
                              disabled={isDeletingPostId === post.id}
                            >
                              <i className={`fas fa-${isDeletingPostId === post.id ? "spinner fa-spin" : "trash-alt"}`}></i>
                              <span>{isDeletingPostId === post.id ? "Deleting..." : "Delete post"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}

                  {postsData.items.length === 0 && (
                    <div className={styles.emptyState}>
                      No posts matched this filter.
                    </div>
                  )}
                </div>
              </div>

              {postsData.pagination.totalPages > 1 && (
                <div className={styles.postsFooter}>
                  <div className={styles.panelPagination}>
                    <button
                      type="button"
                      className={styles.paginationButton}
                      onClick={() => handlePageChange(postsData.pagination.page - 1)}
                      disabled={postsData.pagination.page === 1}
                      aria-label="Previous posts page"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    {Array.from(
                      { length: postsData.pagination.totalPages },
                      (_, index) => index + 1
                    ).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`${styles.paginationButton} ${postsData.pagination.page === pageNumber ? styles.paginationButtonActive : ""}`}
                        onClick={() => handlePageChange(pageNumber)}
                        aria-label={`Posts page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      className={styles.paginationButton}
                      onClick={() => handlePageChange(postsData.pagination.page + 1)}
                      disabled={postsData.pagination.page === postsData.pagination.totalPages}
                      aria-label="Next posts page"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  </div>
  );
}
