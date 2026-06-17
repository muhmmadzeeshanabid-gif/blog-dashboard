"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";
import { useAuth } from "../../../lib/authContext";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function FileThumbnail({ asset }) {
  if (asset.type === "audio") {
    return (
      <div className={styles.mlThumbIcon} style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
        <i className="fas fa-music"></i>
      </div>
    );
  }
  if (asset.type === "video") {
    return (
      <div className={styles.mlThumbIcon} style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>
        <i className="fas fa-play-circle"></i>
      </div>
    );
  }
  if (asset.type === "gallery") {
    return (
      <div className={styles.mlThumbIcon} style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
        <i className="fas fa-images"></i>
      </div>
    );
  }
  if (asset.previewUrl) {
    return (
      <img
        src={asset.previewUrl}
        alt={asset.label}
        className={styles.mlThumbImg}
        loading="lazy"
      />
    );
  }
  return (
    <div className={styles.mlThumbIcon} style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
      <i className="fas fa-file-image"></i>
    </div>
  );
}

function TypeBadge({ type, label }) {
  const config = {
    image:   { bg: "rgba(16,185,129,0.12)",  color: "#10b981", text: "Image" },
    video:   { bg: "rgba(249,115,22,0.12)",  color: "#f97316", text: "Video" },
    audio:   { bg: "rgba(139,92,246,0.12)",  color: "#8b5cf6", text: "Audio" },
    gallery: { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", text: "Gallery" },
  };
  const c = config[type] || { bg: "rgba(107,114,128,0.12)", color: "#6b7280", text: label };
  return (
    <span className={styles.mlTypeBadge} style={{ background: c.bg, color: c.color }}>
      {c.text}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function MediaClient({ initialMedia, isDarkInitial }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsList, setNotificationsList] = useState(() => initialMedia.notifications ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const typeDropRef = useRef(null);
  const actionMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchBarRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsTypeOpen(false);
        setOpenActionId(null);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    const onMouseDown = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setIsNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (typeDropRef.current && !typeDropRef.current.contains(e.target)) setIsTypeOpen(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setOpenActionId(null);
      // Close search when clicking outside the search bar (not on the search icon button)
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(e.target) &&
        !e.target.closest(`[aria-label="Search media"]`)
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);

    try {
      const match = document.cookie.match(/(?:^|; )orin_read_notifications=([^;]*)/);
      if (match) {
        setReadNotificationIds(JSON.parse(decodeURIComponent(match[1])));
      }
    } catch (err) {}

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  const notifications = notificationsList.map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialMedia.items.filter((asset) => {
      const matchType = activeType === "all" || asset.type === activeType;
      if (!matchType) return false;
      if (!q) return true;
      return [asset.label, asset.postTitle, asset.category, asset.fileName, asset.typeLabel]
        .join(" ").toLowerCase().includes(q);
    });
  }, [activeType, initialMedia.items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredAssets.slice(pageStart, pageStart + PAGE_SIZE);

  // stat cards
  const totalFiles = initialMedia.items.length;
  const imageCount = initialMedia.items.filter(a => a.type === "image").length;
  const videoCount = initialMedia.items.filter(a => a.type === "video").length;
  const audioCount = initialMedia.items.filter(a => a.type === "audio").length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((item) => item.id);
    setReadNotificationIds(allIds);
    document.cookie = `orin_read_notifications=${encodeURIComponent(JSON.stringify(allIds))}; path=/; max-age=31536000`;
  };

  const handleClearAll = () => {
    const allIds = notifications.map((item) => item.id);
    let cleared = [];
    try {
      const match = document.cookie.match(/(?:^|; )orin_cleared_notifications=([^;]*)/);
      if (match) cleared = JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {}
    const nextCleared = Array.from(new Set([...cleared, ...allIds]));
    document.cookie = `orin_cleared_notifications=${encodeURIComponent(JSON.stringify(nextCleared))}; path=/; max-age=31536000`;

    setNotificationsList([]);
  };

  const handleNotificationClick = (notificationId) => {
    setReadNotificationIds((currentIds) => {
      const nextIds = currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId];
      document.cookie = `orin_read_notifications=${encodeURIComponent(JSON.stringify(nextIds))}; path=/; max-age=31536000`;
      return nextIds;
    });
  };

  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.body.classList.toggle("bwp-dark-style", next);
    setThemeCookie(next);
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const typeOptions = [
    { key: "all",     label: "All Types" },
    { key: "image",   label: "Images" },
    { key: "video",   label: "Videos" },
    { key: "audio",   label: "Audio" },
    { key: "gallery", label: "Gallery" },
  ];

  const activeTypeLabel = typeOptions.find(o => o.key === activeType)?.label || "All Types";

  const buildPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/media"
          />

          <div className={styles.mainWrapper}>
            {/* Topbar */}
            <div className={styles.topbar}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setIsSidebarCollapsed(c => !c)}
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
                    onClick={() => setIsNotificationsOpen(c => !c)}
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
                          <p className={styles.notificationSubtitle}>{unreadNotifications} unread</p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button type="button" className={styles.notificationAction} onClick={handleMarkAllAsRead}>Mark all read</button>
                          <span style={{ color: "var(--dashboard-border-soft)", fontSize: "12px" }}>|</span>
                          <button type="button" className={styles.notificationAction} style={{ color: "var(--dashboard-danger)" }} onClick={handleClearAll}>Clear all</button>
                        </div>
                      </div>
                      <div className={styles.notificationList}>
                        {notifications.map((item) => (
                          <button key={item.id} type="button"
                            className={`${styles.notificationItem} ${item.unread ? styles.notificationItemUnread : ""}`}
                            onClick={() => handleNotificationClick(item.id)}
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

                {/* Search icon button */}
                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search media"
                  onClick={() => {
                    setIsSearchOpen(c => {
                      const next = !c;
                      if (!next) setSearchQuery("");
                      else setTimeout(() => searchInputRef.current?.focus(), 60);
                      return next;
                    });
                    setIsNotificationsOpen(false);
                    setIsProfileOpen(false);
                  }}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>

                <div className={styles.topOverlay} ref={profileRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isProfileOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Profile"
                    onClick={() => { setIsProfileOpen(c => !c); setIsNotificationsOpen(false); setIsSearchOpen(false); setSearchQuery(""); }}
                  >
                    {user?.avatar
                      ? <img src={user.avatar} alt="Profile" style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
                      : <i className="fas fa-user"></i>
                    }
                  </button>
                  {isProfileOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileDropdownAvatar}>
                          {user?.avatar ? <img src={user.avatar} alt="Profile" /> : <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>}
                        </div>
                        <div className={styles.profileDropdownInfo}>
                          <h4 className={styles.profileDropdownName}>{user?.name || "User Admin"}</h4>
                          <p className={styles.profileDropdownEmail}>{user?.email || "admin@example.com"}</p>
                          <span className={styles.profileDropdownRole}>{user?.role || "Administrator"}</span>
                        </div>
                      </div>
                      <div className={styles.profileDropdownLinks}>
                        <Link href="/dashboard/settings" className={styles.profileDropdownLink} onClick={() => setIsProfileOpen(false)}>
                          <i className="fas fa-cog"></i><span>Profile Settings</span>
                        </Link>
                        <Link href="/" className={styles.profileDropdownLink} onClick={() => setIsProfileOpen(false)}>
                          <i className="fas fa-globe"></i><span>View Website</span>
                        </Link>
                      </div>
                      <div className={styles.profileDropdownFooter}>
                        <button type="button" className={styles.profileDropdownLogout}
                          onClick={async () => { setIsProfileOpen(false); await logout(); }}
                        >
                          <i className="fas fa-sign-out-alt"></i><span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navbar Search Bar */}
            {isSearchOpen && (
              <div className={styles.searchBar} ref={searchBarRef}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="bwp-search-field"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search file name, post title or type..."
                    aria-label="Search media assets"
                    autoFocus
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filteredAssets.length} result{filteredAssets.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <main className={styles.content}>
              {/* Page Header */}
              <div className={styles.mlPageHeader}>
                <div>
                  <h1 className={styles.mlTitle}>Media Library</h1>
                  <p className={styles.mlSubtitle}>Manage all your uploaded media files.</p>
                </div>
                <Link href="/dashboard/posts/new" className={styles.toolbarButtonPrimary}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Upload New</span>
                </Link>
              </div>

              {/* Filter Toolbar */}
              <div className={styles.mlToolbar}>

                {/* Type dropdown */}
                <div className={styles.mlDropWrap} ref={typeDropRef}>
                  <button
                    type="button"
                    className={styles.mlDropBtn}
                    onClick={() => setIsTypeOpen(c => !c)}
                  >
                    <span>{activeTypeLabel}</span>
                    <i className="fas fa-chevron-down" style={{ fontSize: "11px" }}></i>
                  </button>
                  {isTypeOpen && (
                    <div className={styles.mlDropMenu}>
                      {typeOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`${styles.mlDropItem} ${activeType === opt.key ? styles.mlDropItemActive : ""}`}
                          onClick={() => { setActiveType(opt.key); setIsTypeOpen(false); setCurrentPage(1); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Folders (static) */}
                <button type="button" className={styles.mlDropBtn}>
                  <span>All Folders</span>
                  <i className="fas fa-chevron-down" style={{ fontSize: "11px" }}></i>
                </button>

                {/* Filters */}
                <button type="button" className={styles.mlFilterBtn}>
                  <i className="fas fa-sliders-h"></i>
                  <span>Filters</span>
                </button>
              </div>

              {/* Stat Cards */}
              <div className={styles.mlStatsGrid}>
                <div className={styles.mlStatCard}>
                  <div className={styles.mlStatInfo}>
                    <p className={styles.mlStatLabel}>Total Files</p>
                    <h2 className={styles.mlStatValue}>{totalFiles}</h2>
                    <span className={styles.mlStatTrend}>
                      <i className="fas fa-arrow-up"></i> {initialMedia.stats[0]?.trend?.label || "This month"}
                    </span>
                  </div>
                  <div className={styles.mlStatIcon} style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                    <i className="fas fa-layer-group"></i>
                  </div>
                </div>

                <div className={styles.mlStatCard}>
                  <div className={styles.mlStatInfo}>
                    <p className={styles.mlStatLabel}>Images</p>
                    <h2 className={styles.mlStatValue}>{imageCount}</h2>
                    <span className={styles.mlStatTrend}>
                      <i className="fas fa-arrow-up"></i> 8% this month
                    </span>
                  </div>
                  <div className={styles.mlStatIcon} style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                    <i className="fas fa-image"></i>
                  </div>
                </div>

                <div className={styles.mlStatCard}>
                  <div className={styles.mlStatInfo}>
                    <p className={styles.mlStatLabel}>Videos</p>
                    <h2 className={styles.mlStatValue}>{videoCount}</h2>
                    <span className={styles.mlStatTrend} style={{ color: "#ef4444" }}>
                      <i className="fas fa-arrow-up"></i> 15% this month
                    </span>
                  </div>
                  <div className={styles.mlStatIcon} style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>
                    <i className="fas fa-video"></i>
                  </div>
                </div>

                <div className={styles.mlStatCard}>
                  <div className={styles.mlStatInfo}>
                    <p className={styles.mlStatLabel}>Audio</p>
                    <h2 className={styles.mlStatValue}>{audioCount}</h2>
                    <span className={styles.mlStatTrend}>
                      <i className="fas fa-arrow-up"></i> 9% this month
                    </span>
                  </div>
                  <div className={styles.mlStatIcon} style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                    <i className="fas fa-music"></i>
                  </div>
                </div>
              </div>

              {/* File Table */}
              <section className={styles.mlTable}>
                {/* Table Header */}
                <div className={styles.mlTableHead}>
                  <span className={styles.mlColFile}>FILE</span>
                  <span className={styles.mlColName}>NAME</span>
                  <span className={styles.mlColType}>TYPE</span>
                  <span className={styles.mlColSize}>SIZE</span>
                  <span className={styles.mlColDate}>UPLOADED</span>
                  <span className={styles.mlColActions}>ACTIONS</span>
                </div>

                {/* Table Body */}
                <div className={styles.mlTableBody}>
                  {pageItems.map((asset) => (
                    <div key={asset.id} className={styles.mlTableRow}>
                      {/* Thumbnail */}
                      <div className={styles.mlColFile}>
                        <div className={styles.mlThumb}>
                          <FileThumbnail asset={asset} />
                        </div>
                      </div>

                      {/* Name */}
                      <div className={styles.mlColName}>
                        <span className={styles.mlFileName}>{asset.fileName}</span>
                        <span className={styles.mlFileSub}>{asset.label}</span>
                      </div>

                      {/* Type Badge */}
                      <div className={styles.mlColType}>
                        <TypeBadge type={asset.type} label={asset.typeLabel} />
                      </div>

                      {/* Size */}
                      <div className={styles.mlColSize}>
                        <span className={styles.mlMuted}>{asset.sizeLabel}</span>
                      </div>

                      {/* Date */}
                      <div className={styles.mlColDate}>
                        <span className={styles.mlMuted}>{asset.updatedAtLabel}</span>
                      </div>

                      {/* Actions */}
                      <div className={styles.mlColActions}>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.mlActionBtn}
                          aria-label="View file"
                          title="View file"
                        >
                          <i className="fas fa-eye"></i>
                        </a>

                        {/* Dots menu */}
                        <div
                          className={styles.mlActionMenuWrap}
                          ref={openActionId === asset.id ? actionMenuRef : null}
                        >
                          <button
                            type="button"
                            className={styles.mlActionBtn}
                            aria-label="More actions"
                            title="More actions"
                            onClick={() => setOpenActionId(id => id === asset.id ? null : asset.id)}
                          >
                            <i className="fas fa-ellipsis-h"></i>
                          </button>

                          {openActionId === asset.id && (
                            <div className={styles.mlActionMenu}>
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.mlActionMenuItem}
                                onClick={() => setOpenActionId(null)}
                              >
                                <i className="fas fa-external-link-alt"></i>
                                <span>View File</span>
                              </a>
                              <Link
                                href={`/dashboard/posts/new?slug=${asset.postSlug}`}
                                className={styles.mlActionMenuItem}
                                onClick={() => setOpenActionId(null)}
                              >
                                <i className="fas fa-pen"></i>
                                <span>Edit Post</span>
                              </Link>
                              <button
                                type="button"
                                className={styles.mlActionMenuItem}
                                onClick={() => {
                                  navigator.clipboard?.writeText(asset.url);
                                  setOpenActionId(null);
                                }}
                              >
                                <i className="fas fa-link"></i>
                                <span>Copy URL</span>
                              </button>
                              <Link
                                href={`/posts/${asset.postSlug}`}
                                className={styles.mlActionMenuItem}
                                onClick={() => setOpenActionId(null)}
                              >
                                <i className="fas fa-newspaper"></i>
                                <span>View Post</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {pageItems.length === 0 && (
                    <div className={styles.mlEmpty}>
                      <i className="fas fa-photo-video"></i>
                      <p>No files matched your search.</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.mlPagination}>
                    <div className={styles.mlPageButtons}>
                      <button
                        type="button"
                        className={styles.mlPageBtn}
                        onClick={() => handlePageChange(safePage - 1)}
                        disabled={safePage === 1}
                        aria-label="Previous page"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>

                      {buildPageNumbers().map((pg, idx) =>
                        pg === "..." ? (
                          <span key={`dots-${idx}`} className={styles.mlPageDots}>…</span>
                        ) : (
                          <button
                            key={pg}
                            type="button"
                            className={`${styles.mlPageBtn} ${safePage === pg ? styles.mlPageBtnActive : ""}`}
                            onClick={() => handlePageChange(pg)}
                            aria-label={`Page ${pg}`}
                            aria-current={safePage === pg ? "page" : undefined}
                          >
                            {pg}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className={styles.mlPageBtn}
                        onClick={() => handlePageChange(safePage + 1)}
                        disabled={safePage === totalPages}
                        aria-label="Next page"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>

                    <span className={styles.mlPageMeta}>
                      Showing {filteredAssets.length === 0 ? 0 : pageStart + 1} to{" "}
                      {Math.min(pageStart + PAGE_SIZE, filteredAssets.length)} of{" "}
                      {filteredAssets.length}
                    </span>
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
