"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { useAuth } from "../../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

// Simple deterministic hash based on a string to generate stable variations
function getDeterministicValue(str, rangeMin, rangeMax) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);
  const range = rangeMax - rangeMin;
  return rangeMin + (positiveHash % (range * 100)) / 100;
}

export default function AnalyticsClient({ navItems, isDarkInitial, posts = [], currentDateStr, initialNotifications, initialLastUpdatedLabel }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Notifications & Profile & Search states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsList, setNotificationsList] = useState(() => initialNotifications ?? []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDateIndex, setHoveredDateIndex] = useState(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const currentTheme = match ? decodeURIComponent(match[1]) : "";
    const isDarkCookie = currentTheme === "dark";
    setIsDark(isDarkCookie);

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

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const notifications = notificationsList.map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;

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

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  // 1. Dynamic Date Calculation for the last 7 days ending at currentDateStr
  const days = useMemo(() => {
    const refStr = currentDateStr || "2026-06-12";
    const parts = refStr.split("-").map(Number);
    const refDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDate.getTime() - i * 24 * 60 * 60 * 1000);
      list.push(d);
    }
    return list;
  }, [currentDateStr]);

  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const dateRangeLabel = useMemo(() => {
    if (days.length === 0) return "";
    const start = days[0];
    const end = days[days.length - 1];
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  }, [days]);

  // Helper functions for view sums
  const getPostViewsOnDate = (post, dateKey) => {
    return Number(post.viewsByDate?.[dateKey] ?? 0);
  };

  const getPostViewsInRange = (post) => {
    return days.reduce((sum, d) => sum + getPostViewsOnDate(post, formatDateKey(d)), 0);
  };

  // 2. Category Color Mapper
  const getCategoryColor = (category, isDark) => {
    const normalized = String(category).toLowerCase();
    if (normalized.includes("minim")) {
      return isDark ? "#9292ff" : "#6f6fff";
    }
    if (normalized.includes("life")) {
      return isDark ? "#a7a7ff" : "#8a8aff";
    }
    if (normalized.includes("product")) {
      return isDark ? "#bebeff" : "#a3a3ff";
    }
    if (normalized.includes("travel")) {
      return isDark ? "#71d1a1" : "#45b882";
    }
    if (normalized.includes("well")) {
      return isDark ? "#ff9eb5" : "#ff6b8b";
    }
    return isDark ? "#888ea8" : "#bac1d6";
  };

  // 3. Filtered Posts for target panels (stats, line chart, trending posts)
  const filteredPosts = useMemo(() => {
    if (selectedCategory) {
      return posts.filter((p) => p.category === selectedCategory);
    }
    return posts;
  }, [posts, selectedCategory]);

  // 4. Compute Daily Data (Views, Visitors, Page Views) dynamically using deterministic hashes
  const dailyData = useMemo(() => {
    return days.map((d) => {
      const dateKey = formatDateKey(d);
      let views = 0;
      let visitors = 0;
      let pageViews = 0;

      filteredPosts.forEach((p) => {
        const v = getPostViewsOnDate(p, dateKey);
        if (v > 0) {
          views += v;
          // Deterministic ratio for visitors (e.g. 0.38 to 0.58)
          const visRatio = getDeterministicValue(p.id + dateKey + "visitors", 0.38, 0.58);
          visitors += Math.round(visRatio * v);

          // Deterministic ratio for page views (e.g. 1.35 to 1.75)
          const pvRatio = getDeterministicValue(p.id + dateKey + "pageviews", 1.35, 1.75);
          pageViews += Math.round(pvRatio * v);
        }
      });

      return {
        dateKey,
        views,
        visitors,
        pageViews,
      };
    });
  }, [filteredPosts, days]);

  // Daily views and visitors arrays for charts
  const dailyViewsArray = useMemo(() => dailyData.map((d) => d.views), [dailyData]);
  const dailyVisitorsArray = useMemo(() => dailyData.map((d) => d.visitors), [dailyData]);

  const maxViews = useMemo(() => {
    const max = Math.max(...dailyViewsArray, ...dailyVisitorsArray, 0);
    return max === 0 ? 10 : max;
  }, [dailyViewsArray, dailyVisitorsArray]);

  // Coordinates mapping
  const xCoords = [50, 130, 210, 290, 370, 450, 530];

  // Totals calculations based on active filters
  const totalViews = useMemo(() => {
    if (selectedDate) {
      const activeDay = dailyData.find((d) => d.dateKey === selectedDate);
      return activeDay ? activeDay.views : 0;
    }
    return dailyData.reduce((sum, d) => sum + d.views, 0);
  }, [dailyData, selectedDate]);

  const totalVisitors = useMemo(() => {
    if (selectedDate) {
      const activeDay = dailyData.find((d) => d.dateKey === selectedDate);
      return activeDay ? activeDay.visitors : 0;
    }
    return dailyData.reduce((sum, d) => sum + d.visitors, 0);
  }, [dailyData, selectedDate]);

  const totalPageViews = useMemo(() => {
    if (selectedDate) {
      const activeDay = dailyData.find((d) => d.dateKey === selectedDate);
      return activeDay ? activeDay.pageViews : 0;
    }
    return dailyData.reduce((sum, d) => sum + d.pageViews, 0);
  }, [dailyData, selectedDate]);

  // Dynamic average read time based on actual word counts and views
  const avgReadTimeLabel = useMemo(() => {
    let totalSec = 0;
    let totalV = 0;
    filteredPosts.forEach((p) => {
      const v = selectedDate ? getPostViewsOnDate(p, selectedDate) : getPostViewsInRange(p);
      if (v > 0) {
        const wordCount = p.wordCount || 250;
        // 200 words per minute average reading speed
        const readTimeSec = Math.max(30, Math.round((wordCount / 200) * 60));
        totalSec += v * readTimeSec;
        totalV += v;
      }
    });

    if (totalV === 0) return "0m 0s";
    const avgSec = totalSec / totalV;
    const mins = Math.floor(avgSec / 60);
    const secs = Math.round(avgSec % 60);
    return `${mins}m ${secs}s`;
  }, [filteredPosts, selectedDate, days]);

  // 5. Dynamic Category breakdown (Donut SVG and Legends)
  // Note: This remains UNFILTERED by selectedCategory itself so users can click others.
  const categoryShares = useMemo(() => {
    const catViews = {};
    posts.forEach((p) => {
      const cat = p.category || "Others";
      const v = selectedDate ? getPostViewsOnDate(p, selectedDate) : getPostViewsInRange(p);
      catViews[cat] = (catViews[cat] || 0) + v;
    });

    const totalActiveViews = Object.values(catViews).reduce((sum, v) => sum + v, 0);

    const list = Object.entries(catViews)
      .map(([name, views]) => {
        const percent = totalActiveViews === 0 ? 0 : Math.round((views / totalActiveViews) * 100);
        return {
          name,
          views,
          percent,
          color: getCategoryColor(name, isDark),
        };
      })
      .sort((a, b) => b.views - a.views);

    let cumulative = 0;
    return list.map((item) => {
      const offset = 25 - cumulative;
      cumulative += item.percent;
      return {
        ...item,
        dashArray: `${item.percent} ${100 - item.percent}`,
        dashOffset: offset,
      };
    });
  }, [posts, selectedDate, days, isDark]);

  const totalCategoryViews = categoryShares.reduce((sum, c) => sum + c.views, 0);

  // 6. Dynamic Referrers based on real views
  const referrersData = useMemo(() => {
    const shares = [
      { name: "Google", share: 0.452 },
      { name: "Direct", share: 0.281 },
      { name: "Instagram", share: 0.124 },
      { name: "Pinterest", share: 0.076 },
      { name: "Others", share: 0.067 },
    ];
    return shares.map((ref) => {
      const refViews = Math.round(totalViews * ref.share);
      return {
        name: ref.name,
        percent: `${(ref.share * 100).toFixed(1)}%`,
        value: ref.share * 100,
        views: refViews,
      };
    });
  }, [totalViews]);

  // 7. Dynamic Trending Posts (filtered by active category/date/search)
  const trendingPostsList = useMemo(() => {
    return filteredPosts
      .filter((p) =>
        searchQuery ? p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) : true
      )
      .map((p) => {
        const views = selectedDate ? getPostViewsOnDate(p, selectedDate) : getPostViewsInRange(p);
        return {
          id: p.id,
          title: p.title,
          image: p.image,
          category: p.category,
          views,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
  }, [filteredPosts, selectedDate, days, searchQuery]);

  // Formatting helpers
  const formatViewsNumber = (val) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return String(val);
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/analytics"
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
                    placeholder="Search trending posts..."
                    aria-label="Search trending posts"
                  />
                </div>
                <span className={styles.searchMeta}>
                  {trendingPostsList.length} result{trendingPostsList.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <main className={styles.content}>
              <div className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Analytics</h1>
                  <p className={styles.subtitle}>Track your blog&apos;s performance and growth.</p>
                </div>

                <div className={styles.dateControls} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {(selectedCategory || selectedDate) && (
                    <button
                      type="button"
                      className={styles.toolbarButton}
                      style={{
                        borderColor: "var(--dashboard-accent)",
                        color: "var(--dashboard-accent)",
                        background: "transparent",
                        border: "1px solid var(--dashboard-accent)",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedDate(null);
                      }}
                    >
                      <i className="fas fa-undo"></i>
                      <span>Reset Filters</span>
                    </button>
                  )}
                  <button type="button" className={styles.dateBadge}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>{dateRangeLabel}</span>
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className={styles.statsRow}>
                <section className={styles.statCard}>
                  <p className={styles.statLabel}>Total Views</p>
                  <h2 className={styles.statValue}>{formatViewsNumber(totalViews)}</h2>
                  <div className={styles.statTrendRow}>
                    <i className="fas fa-arrow-up"></i>
                    <span>18% vs last 7 days</span>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <p className={styles.statLabel}>Visitors</p>
                  <h2 className={styles.statValue}>{formatViewsNumber(totalVisitors)}</h2>
                  <div className={styles.statTrendRow}>
                    <i className="fas fa-arrow-up"></i>
                    <span>15% vs last 7 days</span>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <p className={styles.statLabel}>Page Views</p>
                  <h2 className={styles.statValue}>{formatViewsNumber(totalPageViews)}</h2>
                  <div className={styles.statTrendRow}>
                    <i className="fas fa-arrow-up"></i>
                    <span>22% vs last 7 days</span>
                  </div>
                </section>
                <section className={styles.statCard}>
                  <p className={styles.statLabel}>Avg. Read Time</p>
                  <h2 className={styles.statValue}>{avgReadTimeLabel}</h2>
                  <div className={styles.statTrendRow}>
                    <i className="fas fa-arrow-up"></i>
                    <span>8% vs last 7 days</span>
                  </div>
                </section>
              </div>

              {/* Middle Row (Line Chart & Referrers) */}
              <div className={styles.analyticsGrid}>
                <section className={styles.panel}>
                  <div className={styles.panelHeader} style={{ marginBottom: "8px" }}>
                    <h2 className={styles.panelTitle}>
                      Views Over Time
                      {selectedCategory && (
                        <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--dashboard-accent)", marginLeft: "8px" }}>
                          ({selectedCategory})
                        </span>
                      )}
                    </h2>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontFamily: "var(--font-poppins)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-block", width: "12px", height: "3px", background: "var(--dashboard-accent)" }}></span>
                        Views
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--dashboard-text-muted)" }}>
                        <span style={{ display: "inline-block", width: "12px", height: "3px", borderBottom: "2px dashed var(--dashboard-text-muted)" }}></span>
                        Visitors
                      </span>
                    </div>
                  </div>

                  <div className={styles.chartContainer}>
                    <svg viewBox="0 0 600 220" width="100%" height="100%">
                      <defs>
                        <linearGradient id="viewsGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--dashboard-accent)" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="var(--dashboard-accent)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="550" y2="30" stroke="var(--dashboard-border-soft)" strokeDasharray="3 3" />
                      <line x1="50" y1="80" x2="550" y2="80" stroke="var(--dashboard-border-soft)" strokeDasharray="3 3" />
                      <line x1="50" y1="130" x2="550" y2="130" stroke="var(--dashboard-border-soft)" strokeDasharray="3 3" />
                      <line x1="50" y1="180" x2="550" y2="180" stroke="var(--dashboard-border-soft)" />

                      {/* Y-Axis Labels */}
                      <text x="36" y="34" fontSize="10" fontFamily="var(--font-poppins)" fill="var(--dashboard-text-muted)" textAnchor="end">
                        {formatViewsNumber(maxViews)}
                      </text>
                      <text x="36" y="84" fontSize="10" fontFamily="var(--font-poppins)" fill="var(--dashboard-text-muted)" textAnchor="end">
                        {formatViewsNumber(Math.round(maxViews * 0.67))}
                      </text>
                      <text x="36" y="134" fontSize="10" fontFamily="var(--font-poppins)" fill="var(--dashboard-text-muted)" textAnchor="end">
                        {formatViewsNumber(Math.round(maxViews * 0.33))}
                      </text>
                      <text x="36" y="184" fontSize="10" fontFamily="var(--font-poppins)" fill="var(--dashboard-text-muted)" textAnchor="end">0</text>

                      {/* Area Fill */}
                      <path
                        d={`M 50 180 ${dailyViewsArray.map((v, idx) => `L ${xCoords[idx]} ${180 - (v / maxViews) * 150}`).join(" ")} L 530 180 Z`}
                        fill="url(#viewsGlow)"
                      />

                      {/* Solid Views Line */}
                      <path
                        d={dailyViewsArray.map((v, idx) => `${idx === 0 ? "M" : "L"} ${xCoords[idx]} ${180 - (v / maxViews) * 150}`).join(" ")}
                        fill="none"
                        stroke="var(--dashboard-accent)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Dotted Visitors Line */}
                      <path
                        d={dailyVisitorsArray.map((v, idx) => `${idx === 0 ? "M" : "L"} ${xCoords[idx]} ${180 - (v / maxViews) * 150}`).join(" ")}
                        fill="none"
                        stroke="var(--dashboard-text-muted)"
                        strokeWidth="1.8"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                      />

                      {/* Interactive hover/click columns & X-Axis Labels */}
                      {days.map((d, idx) => {
                        const x = xCoords[idx];
                        const dateKey = formatDateKey(d);
                        const isSelected = selectedDate === dateKey;
                        const isHovered = hoveredDateIndex === idx;
                        const shortLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        const v = dailyViewsArray[idx];
                        const yViews = 180 - (v / maxViews) * 150;

                        return (
                          <g key={dateKey}>
                            {/* Selector line */}
                            {(isSelected || isHovered) && (
                              <line
                                x1={x}
                                y1="30"
                                x2={x}
                                y2="180"
                                stroke="var(--dashboard-accent)"
                                strokeWidth="1.5"
                                strokeDasharray={isSelected ? "none" : "2 2"}
                                opacity={isSelected ? 0.8 : 0.4}
                              />
                            )}

                            {/* Circle for views node */}
                            <circle
                              cx={x}
                              cy={yViews}
                              r={isSelected ? 6 : 4}
                              fill="var(--dashboard-accent)"
                              stroke={isDark ? "#1b1c21" : "#ffffff"}
                              strokeWidth="2"
                              style={{ transition: "r 0.15s" }}
                            />

                            {/* Clickable X-axis label */}
                            <text
                              x={x}
                              y="202"
                              fontSize="9"
                              fontFamily="var(--font-poppins)"
                              fill={isSelected ? "var(--dashboard-accent)" : "var(--dashboard-text-muted)"}
                              fontWeight={isSelected ? "700" : "normal"}
                              textAnchor="middle"
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                              onMouseEnter={() => setHoveredDateIndex(idx)}
                              onMouseLeave={() => setHoveredDateIndex(null)}
                            >
                              {shortLabel}
                            </text>

                            {/* Hitbox rectangle to cover the vertical column for easy clicking */}
                            <rect
                              x={x - 25}
                              y="25"
                              width="50"
                              height="160"
                              fill="transparent"
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                              onMouseEnter={() => setHoveredDateIndex(idx)}
                              onMouseLeave={() => setHoveredDateIndex(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Top Referrers</h2>
                  </div>

                  <div className={styles.referrerList}>
                    {referrersData.map((ref) => (
                      <div key={ref.name} className={styles.referrerRow}>
                        <span className={styles.referrerLabel}>{ref.name}</span>
                        <div className={styles.referrerTrack}>
                          <div className={styles.referrerBar} style={{ width: `${ref.value}%` }}></div>
                        </div>
                        <span className={styles.referrerPercent} style={{ minWidth: "85px", textAlign: "right" }}>
                          {ref.percent}{" "}
                          <span style={{ color: "var(--dashboard-text-muted)", fontSize: "10px" }}>
                            ({formatViewsNumber(ref.views)})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Bottom Row (Trending Posts & Category Donut) */}
              <div className={styles.analyticsGrid}>
                <section className={styles.analyticsPanelFixed}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Top Trending Posts</h2>
                    <Link href="/dashboard/posts" className={styles.panelLink}>
                      View all &gt;
                    </Link>
                  </div>

                  {/* Added inline style minHeight to prevent layout jiggle on category/date toggling */}
                  <div className={styles.trendingList}>
                    {trendingPostsList.map((post) => (
                      <article key={post.id} className={styles.trendingItem}>
                        <span className={styles.trendingRank}>
                          {post.rank}
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
                            <span>{formatViewsNumber(post.views)} views</span>
                          </div>
                        </div>
                      </article>
                    ))}

                    {trendingPostsList.length === 0 && (
                      <div className={styles.emptyState}>No data found for this selection.</div>
                    )}
                  </div>
                </section>

                <section className={styles.analyticsPanelFixed}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Views by Category</h2>
                  </div>

                  <div className={styles.categoryDonutContainer}>
                    <div className={styles.donutSvgWrapper}>
                      <svg viewBox="0 0 42 42" width="100%" height="100%">
                        <circle
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke="var(--dashboard-border-soft)"
                          strokeWidth="3"
                        />

                        {totalCategoryViews === 0 ? (
                          <circle
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={isDark ? "#535460" : "#d6d6de"}
                            strokeWidth="3.2"
                          />
                        ) : (
                          categoryShares.map((seg) => {
                            const isSelected = selectedCategory === seg.name;
                            if (seg.percent === 0) return null;
                            return (
                              <circle
                                key={seg.name}
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={isSelected ? "4.5" : "3.2"}
                                strokeDasharray={seg.dashArray}
                                strokeDashoffset={seg.dashOffset}
                                style={{
                                  cursor: "pointer",
                                  transition: "stroke-width 0.2s, stroke 0.2s",
                                }}
                                onClick={() => setSelectedCategory(selectedCategory === seg.name ? null : seg.name)}
                              />
                            );
                          })
                        )}
                      </svg>

                      <div className={styles.donutText}>
                        <span className={styles.donutTextVal}>
                          {selectedCategory
                            ? formatViewsNumber(categoryShares.find((c) => c.name === selectedCategory)?.views ?? 0)
                            : formatViewsNumber(totalViews)}
                        </span>
                        <span className={styles.donutTextLabel}>
                          {selectedCategory ? `${selectedCategory} Views` : "Total Views"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.donutLegendList}>
                      {categoryShares.map((item) => {
                        const isSelected = selectedCategory === item.name;
                        return (
                          <div
                            key={item.name}
                            className={styles.donutLegendItem}
                            style={{
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: isSelected ? "var(--dashboard-border-soft)" : "transparent",
                              opacity: selectedCategory && !isSelected ? 0.6 : 1,
                              transition: "all 0.2s",
                            }}
                            onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                          >
                            <div className={styles.donutLegendLabel}>
                              <span className={styles.donutDot} style={{ background: item.color }}></span>
                              <span style={{ fontWeight: isSelected ? "700" : "normal" }}>{item.name}</span>
                            </div>
                            <span className={styles.donutPercent}>{item.percent}%</span>
                          </div>
                        );
                      })}

                      {categoryShares.length === 0 && (
                        <div className={styles.donutLegendItem}>
                          <div className={styles.donutLegendLabel}>
                            <span className={styles.donutDot} style={{ background: "var(--dashboard-text-muted)" }}></span>
                            <span>No categories</span>
                          </div>
                          <span className={styles.donutPercent}>0%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
