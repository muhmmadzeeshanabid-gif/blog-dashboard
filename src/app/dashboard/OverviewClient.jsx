"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function OverviewClient({ initialOverview, navItems, isDarkInitial }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [currentTrendingPage, setCurrentTrendingPage] = useState(1);
  const [overview, setOverview] = useState(initialOverview);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [customFrom, setCustomFrom] = useState(initialOverview.filter.startInput);
  const [customTo, setCustomTo] = useState(initialOverview.filter.endInput);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const dateMenuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      const params = new URLSearchParams(window.location.search);
      fetch(`/api/dashboard/overview?${params.toString()}`, {
        cache: "no-store",
      })
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) {
            setOverview(data);
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
        setIsDateMenuOpen(false);
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

      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setIsDateMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("mousedown", onDocumentMouseDown);

    return () => {
      window.removeEventListener("keydown", onDocumentKeyDown);
      window.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refreshOverview = async () => {
      try {
        const response = await fetch(`/api/dashboard/overview?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const nextOverview = await response.json();
        setOverview(nextOverview);
      } catch {
        return;
      }
    };

    const intervalId = window.setInterval(refreshOverview, 45000);
    return () => window.clearInterval(intervalId);
  }, [overview.filter.key, overview.filter.startInput, overview.filter.endInput]);

  const stats = overview.stats ?? [];
  const recentPosts = overview.recentPosts ?? [];
  const trendingPosts = overview.trendingPosts ?? [];
  const activityItems = overview.activity ?? [];
  const glanceItems = overview.glance ?? [];
  const notifications = (overview.notifications ?? []).map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;
  const filteredPosts = recentPosts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const trendingPageSize = 4;
  const trendingTotalPages = Math.max(
    1,
    Math.ceil(trendingPosts.length / trendingPageSize)
  );
  const trendingStartIndex = (currentTrendingPage - 1) * trendingPageSize;
  const visibleTrendingPosts = trendingPosts.slice(
    trendingStartIndex,
    trendingStartIndex + trendingPageSize
  );

  const applyOverviewParams = async (nextSearch) => {
    const params = new URLSearchParams();

    if (nextSearch.range && nextSearch.range !== "custom") {
      params.set("range", nextSearch.range);
    }

    if (nextSearch.from && nextSearch.to) {
      params.set("from", nextSearch.from);
      params.set("to", nextSearch.to);
    }

    const query = params.toString();
    const url = query ? `/dashboard?${query}` : "/dashboard";

    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/dashboard/overview?${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextOverview = await response.json();
      window.history.replaceState({}, "", url);
      setOverview(nextOverview);
      setCustomFrom(nextOverview.filter.startInput);
      setCustomTo(nextOverview.filter.endInput);
      setCurrentTrendingPage(1);
      setIsDateMenuOpen(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((current) => {
      const next = !current;
      setIsNotificationsOpen(false);
      setIsDateMenuOpen(false);
      if (!next) {
        setSearchQuery("");
      }
      return next;
    });
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => {
      const next = !current;
      if (next) {
        setIsSearchOpen(false);
        setIsDateMenuOpen(false);
      }
      return next;
    });
  };

  const handleDateMenuToggle = () => {
    setIsDateMenuOpen((current) => {
      const next = !current;
      if (next) {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
      return next;
    });
  };

  const handlePresetSelect = async (rangeKey) => {
    await applyOverviewParams({ range: rangeKey });
  };

  const handleCustomApply = async () => {
    if (!customFrom || !customTo || customFrom > customTo) {
      return;
    }

    await applyOverviewParams({ from: customFrom, to: customTo });
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  const handleClearAll = () => {
    setOverview((prev) => ({
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

  const handleTrendingPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > trendingTotalPages) {
      return;
    }
    setCurrentTrendingPage(nextPage);
  };

  const handleTrendingViewMore = () => {
    setCurrentTrendingPage((current) =>
      current === trendingTotalPages ? 1 : current + 1
    );
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard"
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
                placeholder="Search recent posts..."
                aria-label="Search recent posts"
              />
            </div>
            <span className={styles.searchMeta}>
              {filteredPosts.length} result{filteredPosts.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

          <main className={styles.content}>
            <div className={styles.headingRow}>
              <div>
                <h1 className={styles.title}>Overview</h1>
                <p className={styles.subtitle}>
                  Welcome back! Here&apos;s what&apos;s happening with your blog.
                </p>
                <p className={styles.lastUpdated}>
                  {isRefreshing ? "Refreshing data..." : `Updated ${overview.meta.lastUpdatedLabel}`}
                </p>
              </div>

              <div className={styles.dateControls} ref={dateMenuRef}>
                <button
                  type="button"
                  className={styles.dateBadge}
                  onClick={handleDateMenuToggle}
                  aria-expanded={isDateMenuOpen}
                >
                  <i className="fas fa-calendar-alt"></i>
                  <span>{overview.filter.label}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>

                {isDateMenuOpen && (
                  <div className={styles.dateDropdown}>
                    <div className={styles.dateDropdownSection}>
                      <p className={styles.dateDropdownLabel}>Quick ranges</p>
                      <div className={styles.dateOptionList}>
                        {overview.filter.options.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={`${styles.dateOptionButton} ${overview.filter.key === option.key ? styles.dateOptionButtonActive : ""}`}
                            onClick={() => handlePresetSelect(option.key)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.dateDropdownSection}>
                      <p className={styles.dateDropdownLabel}>Custom range</p>
                      <div className={styles.dateInputGrid}>
                        <label className={styles.dateInputLabel}>
                          <span>From</span>
                          <input
                            type="date"
                            value={customFrom}
                            onChange={(event) => setCustomFrom(event.target.value)}
                          />
                        </label>
                        <label className={styles.dateInputLabel}>
                          <span>To</span>
                          <input
                            type="date"
                            value={customTo}
                            onChange={(event) => setCustomTo(event.target.value)}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className={styles.applyDateButton}
                        onClick={handleCustomApply}
                      >
                        Apply range
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.statsRow}>
              {stats.map((stat) => (
                <section key={stat.label} className={styles.statCard}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <h2 className={styles.statValue}>{stat.value}</h2>
                  <div className={stat.trend.down ? styles.statMetaDown : styles.statMeta}>
                    <i className={stat.trend.down ? "fas fa-arrow-down" : "fas fa-arrow-up"}></i>
                    <span>{stat.trend.label}</span>
                  </div>
                </section>
              ))}
            </div>

            <div className={styles.grid}>
              <div className={styles.leftColumn}>
                <section className={`${styles.panel} ${styles.featurePanel}`}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Recent Posts</h2>
                    <span className={styles.panelLink}>Live data</span>
                  </div>

                  <div className={styles.recentList}>
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((post) => (
                        <div key={post.id} className={styles.recentItem}>
                          <div className={styles.thumb}>
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              sizes="42px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <p className={styles.recentTitle}>{post.title}</p>
                          <span className={styles.recentMeta}>{post.date}</span>
                          <span className={styles.recentViews}>{post.views}</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        No recent posts matched your search.
                      </div>
                    )}
                  </div>
                </section>

                <section className={`${styles.panel} ${styles.featurePanel}`}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Activity</h2>
                  </div>

                  <div className={styles.activityList}>
                    {activityItems.map((item) => (
                      <div key={item.id} className={styles.activityRow}>
                        <span className={styles.activityDot}></span>
                        <span>{item.text}</span>
                        <span className={styles.activityTime}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className={styles.rightColumn}>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Trending Posts</h2>
                    <button
                      type="button"
                      className={styles.panelLinkButton}
                      onClick={handleTrendingViewMore}
                    >
                      View more
                    </button>
                  </div>

                  <div className={styles.trendingList}>
                    {visibleTrendingPosts.map((post, index) => (
                      <article key={post.id} className={styles.trendingItem}>
                        <span className={styles.trendingRank}>
                          {String(trendingStartIndex + index + 1).padStart(2, "0")}
                        </span>
                        <div className={styles.trendingThumb}>
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes="56px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className={styles.trendingBody}>
                          <h3 className={styles.trendingTitle}>{post.title}</h3>
                          <div className={styles.trendingMetaRow}>
                            <span>{post.category}</span>
                            <span>{post.views} views</span>
                          </div>
                        </div>
                        <span className={styles.trendingLift}>{post.lift}</span>
                      </article>
                    ))}
                  </div>

                  {trendingTotalPages > 1 && (
                    <div className={styles.panelPagination}>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => handleTrendingPageChange(currentTrendingPage - 1)}
                        disabled={currentTrendingPage === 1}
                        aria-label="Previous trending posts page"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>

                      {Array.from({ length: trendingTotalPages }, (_, index) => (
                        <button
                          key={index + 1}
                          type="button"
                          className={`${styles.paginationButton} ${currentTrendingPage === index + 1 ? styles.paginationButtonActive : ""}`}
                          onClick={() => handleTrendingPageChange(index + 1)}
                          aria-label={`Trending posts page ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      ))}

                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => handleTrendingPageChange(currentTrendingPage + 1)}
                        disabled={currentTrendingPage === trendingTotalPages}
                        aria-label="Next trending posts page"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>At a Glance</h2>
                  </div>

                  <div className={styles.glanceWrap}>
                    <div className={styles.glanceList}>
                      {glanceItems.map((item) => (
                        <div key={item.label} className={styles.glanceRow}>
                          <span className={styles.glanceLabel}>
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                          </span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className={styles.glanceArt}>
                      <Image
                        src="/images/05-bench-accounting-h51-unsplash.jpg"
                        alt="Desk scene"
                        fill
                        sizes="120px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
  );
}
