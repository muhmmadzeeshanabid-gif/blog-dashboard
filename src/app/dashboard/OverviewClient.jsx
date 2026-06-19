"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../../lib/authContext";
import { useNotifications } from "../../lib/notificationsContext";
import { useDashboardSettings } from "./layout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function OverviewClient({ initialOverview, navItems, isDarkInitial }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { showSidebar: dbShowSidebar, sidebarPosition: dbSidebarPosition } = useDashboardSettings();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!dbShowSidebar);

  useEffect(() => {
    setIsSidebarCollapsed(!dbShowSidebar);
  }, [dbShowSidebar]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [currentTrendingPage, setCurrentTrendingPage] = useState(1);
  const [overview, setOverview] = useState(initialOverview);
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
    refresh: refreshNotificationsState,
  } = useNotifications();
  const [customFrom, setCustomFrom] = useState(initialOverview.filter.startInput);
  const [customTo, setCustomTo] = useState(initialOverview.filter.endInput);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("categories");
  const [activeSliceIndex, setActiveSliceIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartSvgRef = useRef(null);
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
        refreshNotificationsState();
      } catch {
        return;
      }
    };

    const intervalId = window.setInterval(refreshOverview, 45000);
    return () => window.clearInterval(intervalId);
  }, [overview.filter.key, overview.filter.startInput, overview.filter.endInput, refreshNotificationsState]);

  const stats = overview.stats ?? [];
  const recentPosts = overview.recentPosts ?? [];
  const trendingPosts = overview.trendingPosts ?? [];
  const activityItems = overview.activity ?? [];
  
  const analyticsData = overview.analytics ?? [];
  const categoryAnalytics = overview.categoryAnalytics ?? [];
  const maxViews = Math.max(10, ...analyticsData.map(item => item.views));
  const pathD = analyticsData.map((item, i) => {
    const x = 45 + (i / Math.max(1, analyticsData.length - 1)) * 440;
    const y = 185 - (item.views / maxViews) * 165;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const areaD = analyticsData.length > 0 ? (
    `${pathD} L ${(45 + 440).toFixed(1)} 185 L 45 185 Z`
  ) : "";

  const totalCategoryViews = categoryAnalytics.reduce((sum, item) => sum + item.views, 0);
  const totalCategoryPosts = categoryAnalytics.reduce((sum, item) => sum + item.postsCount, 0);
  const totalCategoryMetric = totalCategoryViews > 0 ? totalCategoryViews : totalCategoryPosts;
  const isMetricViews = totalCategoryViews > 0;

  let cumulativePercent = 0;
  const doughnutSlices = categoryAnalytics.map((item, index) => {
    const value = isMetricViews ? item.views : item.postsCount;
    const percent = totalCategoryMetric > 0 ? (value / totalCategoryMetric) * 100 : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent / 100;
    const endPercent = cumulativePercent;

    return {
      category: item.category,
      value,
      percent,
      startPercent,
      endPercent,
    };
  });

  const CHART_PALETTE = [
    "var(--dashboard-accent)",
    "#00c2a8", // Teal
    "#3b82f6", // Blue
    "#e11d48", // Rose
    "#f59e0b", // Amber
    "#8b5cf6", // Purple
    "#ec4899", // Magenta/Pink
    "#10b981", // Green
  ];

  const getDoughnutSlicePath = (cx, cy, innerRadius, outerRadius, startPercent, endPercent) => {
    const startAngle = startPercent * 360;
    const endAngle = endPercent * 360;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1_out = cx + outerRadius * Math.cos(startRad);
    const y1_out = cy + outerRadius * Math.sin(startRad);
    const x2_out = cx + outerRadius * Math.cos(endRad);
    const y2_out = cy + outerRadius * Math.sin(endRad);

    const x1_in = cx + innerRadius * Math.cos(endRad);
    const y1_in = cy + innerRadius * Math.sin(endRad);
    const x2_in = cx + innerRadius * Math.cos(startRad);
    const y2_in = cy + innerRadius * Math.sin(startRad);

    const largeArc = endPercent - startPercent > 0.5 ? 1 : 0;

    if (endPercent - startPercent >= 0.999) {
      return `
        M ${cx} ${cy - outerRadius}
        A ${outerRadius} ${outerRadius} 0 1 1 ${cx - 0.01} ${cy - outerRadius}
        Z
        M ${cx} ${cy - innerRadius}
        A ${innerRadius} ${innerRadius} 0 1 0 ${cx - 0.01} ${cy - innerRadius}
        Z
      `;
    }

    return `
      M ${x1_out} ${y1_out}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2_out} ${y2_out}
      L ${x1_in} ${y1_in}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2_in} ${y2_in}
      Z
    `;
  };

  const getSliceTransform = (startPercent, endPercent, index) => {
    if (activeSliceIndex !== index) return "";

    const startAngle = startPercent * 360;
    const endAngle = endPercent * 360;
    const bisectorAngle = startAngle + (endAngle - startAngle) / 2;
    const bisectorRad = ((bisectorAngle - 90) * Math.PI) / 180;

    const offset = 8;
    const dx = offset * Math.cos(bisectorRad);
    const dy = offset * Math.sin(bisectorRad);

    return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  };

  const getLabelCoordinates = (cx, cy, innerRadius, outerRadius, startPercent, endPercent) => {
    const startAngle = startPercent * 360;
    const endAngle = endPercent * 360;
    const bisectorAngle = startAngle + (endAngle - startAngle) / 2;
    const bisectorRad = ((bisectorAngle - 90) * Math.PI) / 180;

    const rText = innerRadius + (outerRadius - innerRadius) / 2;
    const x = cx + rText * Math.cos(bisectorRad);
    const y = cy + rText * Math.sin(bisectorRad);

    return { x, y };
  };


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
    const params = new URLSearchParams(window.location.search);

    if (nextSearch.range) {
      if (nextSearch.range !== "custom") {
        params.set("range", nextSearch.range);
        params.delete("from");
        params.delete("to");
        params.delete("focusDate");
      }
    }

    if (nextSearch.from && nextSearch.to) {
      params.set("from", nextSearch.from);
      params.set("to", nextSearch.to);
      params.delete("range");
      params.delete("focusDate");
    }

    if (nextSearch.focusDate !== undefined) {
      if (nextSearch.focusDate) {
        params.set("focusDate", nextSearch.focusDate);
      } else {
        params.delete("focusDate");
      }
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
      refreshNotificationsState();
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
            activeHref="/dashboard"
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
                type="text"
                className="bwp-search-field"
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
                <section className={`${styles.panel} ${styles.featurePanel}`}>
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

                <section className={`${styles.panel} ${styles.featurePanel}`}>
                  <div className={styles.panelHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h2 className={styles.panelTitle}>Analytics</h2>
                      {overview.filter.focusDate && (
                        <button
                          type="button"
                          className={styles.resetDateBadge}
                          onClick={() => applyOverviewParams({ focusDate: null })}
                          title="Reset date filter"
                        >
                          <span>{overview.filter.focusDate}</span>
                          <i className="fas fa-times" style={{ marginLeft: "6px", fontSize: "9px" }}></i>
                        </button>
                      )}
                    </div>
                    <div className={styles.tabGroup}>
                      <button
                        type="button"
                        className={`${styles.tabButton} ${activeAnalyticsTab === "categories" ? styles.tabButtonActive : ""}`}
                        onClick={() => setActiveAnalyticsTab("categories")}
                      >
                        Categories
                      </button>
                      <button
                        type="button"
                        className={`${styles.tabButton} ${activeAnalyticsTab === "views" ? styles.tabButtonActive : ""}`}
                        onClick={() => setActiveAnalyticsTab("views")}
                      >
                        Views Trend
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    {activeAnalyticsTab === "categories" ? (
                      categoryAnalytics.length > 0 ? (
                        <div className={styles.doughnutContainer}>
                          {/* Legend on top */}
                          <div className={styles.doughnutLegend}>
                            {doughnutSlices.map((slice, i) => {
                              const color = CHART_PALETTE[i % CHART_PALETTE.length];
                              const isActive = activeSliceIndex === i;
                              return (
                                <div
                                  key={slice.category}
                                  className={`${styles.legendItem} ${isActive ? styles.legendItemActive : ""}`}
                                  onClick={() => setActiveSliceIndex(activeSliceIndex === i ? null : i)}
                                >
                                  <span
                                    className={styles.legendDot}
                                    style={{ backgroundColor: color }}
                                  />
                                  <span style={{ fontWeight: 600 }}>
                                    {slice.category}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Svg chart below legend */}
                          <div className={styles.doughnutSvgWrapper}>
                            <svg viewBox="0 0 300 300" className={styles.doughnutSvg} aria-label="Category distribution chart">
                              <g>
                                {doughnutSlices.map((slice, i) => {
                                  const path = getDoughnutSlicePath(150, 150, 80, 130, slice.startPercent, slice.endPercent);
                                  const transform = getSliceTransform(slice.startPercent, slice.endPercent, i);
                                  const color = CHART_PALETTE[i % CHART_PALETTE.length];
                                  const labelCoords = getLabelCoordinates(150, 150, 80, 130, slice.startPercent, slice.endPercent);
                                  
                                  return (
                                    <g key={slice.category}>
                                      <path
                                        d={path}
                                        fill={color}
                                        className={styles.doughnutSlice}
                                        style={{
                                          transform,
                                          transformOrigin: "150px 150px",
                                          cursor: "pointer",
                                        }}
                                        onClick={() => setActiveSliceIndex(activeSliceIndex === i ? null : i)}
                                      >
                                        <title>{`${slice.category}: ${slice.value} (${slice.percent.toFixed(1)}%)`}</title>
                                      </path>
                                      {slice.percent >= 5 && (
                                        <text
                                          x={labelCoords.x}
                                          y={labelCoords.y}
                                          fill="#ffffff"
                                          fontSize="10px"
                                          fontWeight="700"
                                          textAnchor="middle"
                                          dominantBaseline="central"
                                          style={{
                                            pointerEvents: "none",
                                            transform,
                                            transformOrigin: "150px 150px",
                                            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                          }}
                                        >
                                          {Math.round(slice.percent)}%
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                                
                                {/* Center Cutout Text */}
                                <circle cx={150} cy={150} r={76} fill="var(--dashboard-card-bg)" style={{ cursor: "pointer" }} onClick={() => setActiveSliceIndex(null)} />
                                <text
                                  x={150}
                                  y={142}
                                  textAnchor="middle"
                                  fill="var(--dashboard-text)"
                                  fontSize="26px"
                                  fontWeight="700"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setActiveSliceIndex(null)}
                                >
                                  {isMetricViews ? totalCategoryViews.toLocaleString() : totalCategoryPosts}
                                </text>
                                <text
                                  x={150}
                                  y={166}
                                  textAnchor="middle"
                                  fill="var(--dashboard-text-muted)"
                                  fontSize="10.5px"
                                  fontWeight="600"
                                  letterSpacing="0.5px"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setActiveSliceIndex(null)}
                                >
                                  {isMetricViews ? "TOTAL VIEWS" : "TOTAL POSTS"}
                                </text>
                              </g>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--dashboard-text-muted)", fontSize: "12px" }}>
                          No category analytics available
                        </div>
                      )
                    ) : (
                      <div style={{ flex: 1, position: "relative", minHeight: "180px", marginTop: "10px" }}>
                        {analyticsData.length > 0 ? (
                          <svg
                            ref={chartSvgRef}
                            viewBox="0 0 500 220"
                            style={{ width: "100%", height: "100%", overflow: "visible", cursor: "crosshair" }}
                            aria-label="Views chart"
                            onMouseMove={(e) => {
                              if (!chartSvgRef.current || analyticsData.length === 0) return;
                              const rect = chartSvgRef.current.getBoundingClientRect();
                              const scaleX = 500 / rect.width;
                              const svgX = (e.clientX - rect.left) * scaleX;
                              let closest = 0;
                              let minDist = Infinity;
                              analyticsData.forEach((_, i) => {
                                const cx = 45 + (i / Math.max(1, analyticsData.length - 1)) * 440;
                                const dist = Math.abs(svgX - cx);
                                if (dist < minDist) { minDist = dist; closest = i; }
                              });
                              setHoverIndex(closest);
                            }}
                            onMouseLeave={() => setHoverIndex(null)}
                          >
                            <defs>
                              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--dashboard-accent)" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="var(--dashboard-accent)" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            <line x1="45" y1="20" x2="485" y2="20" stroke="var(--dashboard-border-soft)" strokeDasharray="4 4" />
                            <line x1="45" y1="75" x2="485" y2="75" stroke="var(--dashboard-border-soft)" strokeDasharray="4 4" />
                            <line x1="45" y1="130" x2="485" y2="130" stroke="var(--dashboard-border-soft)" strokeDasharray="4 4" />
                            <line x1="45" y1="185" x2="485" y2="185" stroke="var(--dashboard-border-soft)" />

                            {/* Y-Axis Labels */}
                            <text x="35" y="24" fill="var(--dashboard-text-muted)" fontSize="10px" fontWeight="600" textAnchor="end">{Math.round(maxViews)}</text>
                            <text x="35" y="79" fill="var(--dashboard-text-muted)" fontSize="10px" fontWeight="600" textAnchor="end">{Math.round(maxViews * 0.66)}</text>
                            <text x="35" y="134" fill="var(--dashboard-text-muted)" fontSize="10px" fontWeight="600" textAnchor="end">{Math.round(maxViews * 0.33)}</text>
                            <text x="35" y="189" fill="var(--dashboard-text-muted)" fontSize="10px" fontWeight="600" textAnchor="end">0</text>

                            {/* Area under the line */}
                            {areaD && (
                              <path d={areaD} fill="url(#viewsGradient)" />
                            )}

                            {/* The views line */}
                            {pathD && (
                              <path
                                d={pathD}
                                fill="none"
                                stroke="var(--dashboard-accent)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* X-Axis Labels */}
                            {analyticsData.map((item, i) => {
                              const showLabel = i === 0 || i === analyticsData.length - 1 || (analyticsData.length < 10 ? true : i % Math.ceil(analyticsData.length / 5) === 0);
                              if (!showLabel) return null;
                              const x = 45 + (i / Math.max(1, analyticsData.length - 1)) * 440;
                              const isSelected = overview.filter.focusDate === item.date;
                              return (
                                <text
                                  key={i}
                                  x={x}
                                  y="206"
                                  fill={isSelected ? "var(--dashboard-accent)" : "var(--dashboard-text-muted)"}
                                  fontSize="9.5px"
                                  fontWeight={isSelected ? "700" : "600"}
                                  textAnchor="middle"
                                  style={{ cursor: "pointer", transition: "fill 0.2s ease, font-weight 0.2s ease" }}
                                  onClick={() => applyOverviewParams({ focusDate: isSelected ? null : item.date })}
                                >
                                  {item.label}
                                </text>
                              );
                            })}

                            {/* Vertical tracker lines & tooltips for selected date */}
                            {analyticsData.map((item, i) => {
                              const isSelected = overview.filter.focusDate === item.date;
                              if (!isSelected) return null;
                              const x = 45 + (i / Math.max(1, analyticsData.length - 1)) * 440;
                              const y = 185 - (item.views / maxViews) * 165;
                              return (
                                <g key={`tracker-group-${i}`} style={{ pointerEvents: "none" }}>
                                  <line
                                    x1={x}
                                    y1="20"
                                    x2={x}
                                    y2="185"
                                    stroke="var(--dashboard-accent)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                  />
                                  <rect
                                    x={x - 45}
                                    y={y - 32}
                                    width="90"
                                    height="22"
                                    rx="6"
                                    fill="var(--dashboard-accent)"
                                  />
                                  <polygon
                                    points={`${x - 4},${y - 10} ${x + 4},${y - 10} ${x},${y - 6}`}
                                    fill="var(--dashboard-accent)"
                                  />
                                  <text
                                    x={x}
                                    y={y - 18}
                                    fill="#ffffff"
                                    fontSize="10px"
                                    fontWeight="700"
                                    textAnchor="middle"
                                  >
                                    {item.views.toLocaleString()} views
                                  </text>
                                </g>
                              );
                            })}

                            {/* Interactive data points */}
                            {analyticsData.map((item, i) => {
                              const x = 45 + (i / Math.max(1, analyticsData.length - 1)) * 440;
                              const y = 185 - (item.views / maxViews) * 165;
                              const isSelected = overview.filter.focusDate === item.date;
                              const isHovered = hoverIndex === i;

                              const handleDotClick = () => {
                                if (isSelected) {
                                  applyOverviewParams({ focusDate: null });
                                } else {
                                  applyOverviewParams({ focusDate: item.date });
                                }
                              };

                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r={isSelected ? "6.5" : isHovered ? "5.5" : "4.5"}
                                  fill={isSelected ? "var(--dashboard-accent)" : isHovered ? "var(--dashboard-accent)" : "var(--dashboard-card-bg)"}
                                  stroke={isSelected ? "var(--dashboard-card-bg)" : "var(--dashboard-accent)"}
                                  strokeWidth="2.5"
                                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                                  className={styles.chartDot}
                                  onClick={handleDotClick}
                                />
                              );
                            })}

                            {/* Hover tooltip */}
                            {hoverIndex !== null && (() => {
                              const item = analyticsData[hoverIndex];
                              const isSelected = overview.filter.focusDate === item.date;
                              if (isSelected) return null; // selected tooltip already shows
                              const x = 45 + (hoverIndex / Math.max(1, analyticsData.length - 1)) * 440;
                              const y = 185 - (item.views / maxViews) * 165;
                              const tooltipX = Math.min(Math.max(x, 55), 440);
                              return (
                                <g style={{ pointerEvents: "none" }}>
                                  <line
                                    x1={x} y1="20" x2={x} y2="185"
                                    stroke="var(--dashboard-text-muted)"
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                    opacity="0.5"
                                  />
                                  <rect
                                    x={tooltipX - 48}
                                    y={y - 36}
                                    width="96"
                                    height="24"
                                    rx="7"
                                    fill="var(--dashboard-card-soft)"
                                    stroke="var(--dashboard-card-border)"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={tooltipX}
                                    y={y - 21}
                                    fill="var(--dashboard-text)"
                                    fontSize="10px"
                                    fontWeight="700"
                                    textAnchor="middle"
                                  >
                                    {item.label}
                                  </text>
                                  <text
                                    x={tooltipX}
                                    y={y - 10}
                                    fill="var(--dashboard-accent)"
                                    fontSize="9px"
                                    fontWeight="600"
                                    textAnchor="middle"
                                  >
                                    {item.views.toLocaleString()} views
                                  </text>
                                </g>
                              );
                            })()}
                          </svg>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--dashboard-text-muted)", fontSize: "12px" }}>
                            No analytics data available
                          </div>
                        )}
                      </div>
                    )}
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
