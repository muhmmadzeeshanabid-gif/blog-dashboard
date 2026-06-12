"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

const sidebarFooterActions = [
  { id: "profile", label: "Admin Profile", icon: "fas fa-user-circle" },
  { id: "settings", label: "Settings", icon: "fas fa-cog" },
  { id: "logout", label: "Logout", icon: "fas fa-sign-out-alt" },
];

export default function PostsClient({ initialPosts, navItems }) {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.body.classList.contains("bwp-dark-style")
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialPosts.filters.query));
  const [searchQuery, setSearchQuery] = useState(initialPosts.filters.query);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [postsData, setPostsData] = useState(initialPosts);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notificationsRef = useRef(null);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
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

      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
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

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.brandWordmark}>ORIN</span>
            <span className={styles.brandLabel}>Dashboard</span>
          </div>

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

        <div
          className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}
        >
          <aside
            className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}
          >
            <div className={styles.sidebarScroll}>
              <div>
                <div className={styles.sidebarTop}>
                  <button
                    type="button"
                    className={styles.sidebarToggle}
                    aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                    onClick={handleSidebarToggle}
                  >
                    <i className={`fas fa-${isSidebarCollapsed ? "bars" : "times"}`}></i>
                  </button>
                  {!isSidebarCollapsed && (
                    <div className={styles.sidebarTopText}>
                      <span className={styles.sidebarEyebrow}>Workspace</span>
                      <strong>Dashboard Menu</strong>
                    </div>
                  )}
                </div>

                <nav className={styles.nav} aria-label="Posts navigation">
                  {navItems.map((item) =>
                    item.href ? (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={item.active ? styles.navItemActive : styles.navItem}
                        title={item.label}
                      >
                        <i className={`${item.icon} ${styles.navIcon}`}></i>
                        <span className={styles.navText}>{item.label}</span>
                      </Link>
                    ) : (
                      <span
                        key={item.label}
                        className={`${item.active ? styles.navItemActive : styles.navItem} ${styles.navItemMuted}`}
                        title={item.label}
                      >
                        <i className={`${item.icon} ${styles.navIcon}`}></i>
                        <span className={styles.navText}>{item.label}</span>
                      </span>
                    )
                  )}
                </nav>
              </div>

              <div className={styles.sidebarFooter}>
                <div className={styles.profileCard}>
                  <div className={styles.profileAvatar}>A</div>
                  {!isSidebarCollapsed && (
                    <div className={styles.profileMeta}>
                      <strong>Admin</strong>
                      <span>Manage your ORIN blog</span>
                    </div>
                  )}
                </div>

                <div className={styles.footerActionList}>
                  {sidebarFooterActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={styles.footerAction}
                      title={action.label}
                    >
                      <i className={action.icon}></i>
                      <span className={styles.footerActionText}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

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

                <button
                  type="button"
                  className={styles.toolbarButtonPrimary}
                  title="New post editor will be added next"
                >
                  <i className="fas fa-plus"></i>
                  <span>New Post</span>
                </button>
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
                      <button
                        type="button"
                        className={styles.rowActionButton}
                        aria-label={`Manage ${post.title}`}
                        title="More actions"
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
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
  );
}
