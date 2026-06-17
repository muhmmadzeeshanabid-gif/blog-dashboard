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

function AudioArtwork() {
  return (
    <div className={styles.mediaAudioArtwork}>
      <div className={styles.mediaAudioBars} aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <i className="fas fa-wave-square" aria-hidden="true"></i>
    </div>
  );
}

function LibraryPreview({ asset }) {
  if (asset.type === "audio") {
    return <AudioArtwork />;
  }

  return (
    <img
      src={asset.previewUrl}
      alt={asset.label}
      className={styles.mediaPreviewImage}
      loading="lazy"
    />
  );
}

function DetailPreview({ asset }) {
  if (!asset) {
    return null;
  }

  if (asset.type === "audio") {
    return <AudioArtwork />;
  }

  return (
    <img
      src={asset.previewUrl || asset.url}
      alt={asset.label}
      className={styles.mediaPreviewImage}
      loading="lazy"
    />
  );
}

export default function MediaClient({ initialMedia, isDarkInitial }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeType, setActiveType] = useState(initialMedia.filters.active);
  const [selectedAssetId, setSelectedAssetId] = useState(initialMedia.items[0]?.id ?? null);
  const [currentPage, setCurrentPage] = useState(1);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsList, setNotificationsList] = useState(() => initialMedia.notifications ?? []);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const filterMenuRef = useRef(null);

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

      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
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

  const notifications = notificationsList.map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;

  const filteredAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return initialMedia.items.filter((asset) => {
      const matchesType = activeType === "all" ? true : asset.type === activeType;
      const haystack = [
        asset.label,
        asset.postTitle,
        asset.category,
        asset.fileName,
        asset.typeLabel,
        asset.originLabel,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;

      return matchesType && matchesQuery;
    });
  }, [activeType, initialMedia.items, searchQuery]);

  const selectedAsset = useMemo(() => {
    return (
      filteredAssets.find((asset) => asset.id === selectedAssetId) ||
      filteredAssets[0] ||
      initialMedia.items[0] ||
      null
    );
  }, [filteredAssets, initialMedia.items, selectedAssetId]);

  const activeFilterLabel =
    initialMedia.filters.options.find((option) => option.key === activeType)?.label ||
    "All assets";

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
      setIsFilterMenuOpen(false);
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
        setIsFilterMenuOpen(false);
      }
      return next;
    });
  };

  const handleFilterToggle = () => {
    setIsFilterMenuOpen((current) => {
      const next = !current;
      if (next) {
        setIsNotificationsOpen(false);
        setIsSearchOpen(false);
      }
      return next;
    });
  };

  const handleFilterSelect = (typeKey) => {
    setActiveType(typeKey);
    setIsFilterMenuOpen(false);
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
                  aria-label="Search assets"
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
                    placeholder="Search file name, post title, or category..."
                    aria-label="Search media assets"
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filteredAssets.length} result{filteredAssets.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <main className={styles.content}>
              <div className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Media</h1>
                  <p className={styles.subtitle}>
                    Review uploads, gallery frames, and linked media without leaving the dashboard.
                  </p>
                  <p className={styles.lastUpdated}>
                    Updated {initialMedia.meta.lastUpdatedLabel}
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
                        <p className={styles.filterLabel}>Show assets</p>
                        <div className={styles.filterOptionList}>
                          {initialMedia.filters.options.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              className={`${styles.filterOptionButton} ${activeType === option.key ? styles.filterOptionButtonActive : ""}`}
                              onClick={() => handleFilterSelect(option.key)}
                            >
                              <span>{option.label}</span>
                              <strong>{initialMedia.filters.totals[option.key]}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/dashboard/posts" className={styles.toolbarButton}>
                    <i className="fas fa-newspaper"></i>
                    <span>Manage Posts</span>
                  </Link>

                  <Link href="/dashboard/posts/new" className={styles.toolbarButtonPrimary}>
                    <i className="fas fa-plus"></i>
                    <span>Upload Media</span>
                  </Link>
                </div>
              </div>

              <div className={styles.statsRow}>
                {initialMedia.stats.map((stat) => (
                  <section key={stat.label} className={styles.statCard}>
                    <p className={styles.statLabel}>{stat.label}</p>
                    <h2 className={styles.statValue}>{stat.value}</h2>
                    <div className={styles.statMeta}>
                      <i className="fas fa-arrow-up"></i>
                      <span>{stat.trend.label}</span>
                    </div>
                  </section>
                ))}
              </div>

              <div className={styles.mediaWorkspace}>
                <section className={`${styles.panel} ${styles.mediaLibraryPanel}`}>
                  <div className={styles.mediaToolbar}>
                    <div>
                      <h2 className={styles.panelTitle}>Library</h2>
                      <p className={styles.postsPanelMeta}>
                        Showing {filteredAssets.length} of {initialMedia.items.length} assets
                      </p>
                    </div>
                    <div className={styles.mediaToolbarMeta}>
                      <span className={styles.mediaCountPill}>{activeFilterLabel}</span>
                      <span className={styles.mediaCountPill}>{initialMedia.storage.usedLabel}</span>
                    </div>
                  </div>

                  <div className={styles.mediaLibraryGrid}>
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        className={`${styles.mediaCard} ${selectedAsset?.id === asset.id ? styles.mediaCardActive : ""}`}
                        aria-pressed={selectedAsset?.id === asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                      >
                        <div className={styles.mediaCardPreview}>
                          <LibraryPreview asset={asset} />
                          {asset.type === "video" && (
                            <span className={styles.mediaPreviewIcon}>
                              <i className="fas fa-play"></i>
                            </span>
                          )}
                          {asset.type === "gallery" && (
                            <span className={styles.mediaPreviewIcon}>
                              <i className="fas fa-images"></i>
                            </span>
                          )}
                          <div className={styles.mediaCardOverlay}>
                            <span className={styles.mediaTypeBadge}>{asset.badgeLabel}</span>
                            <span className={styles.mediaUsageBadge}>{asset.postStatusLabel}</span>
                          </div>
                        </div>

                        <div className={styles.mediaCardBody}>
                          <div>
                            <h3 className={styles.mediaCardTitle}>{asset.postTitle}</h3>
                            <p className={styles.mediaCardLabel}>{asset.label}</p>
                          </div>
                          <div className={styles.mediaCardMeta}>
                            <span>{asset.category}</span>
                            <span>{asset.sizeLabel}</span>
                            <span>{asset.extension}</span>
                          </div>
                          <div className={styles.mediaCardFooter}>
                            <span>{asset.originLabel}</span>
                            <span>{asset.updatedAtLabel}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredAssets.length === 0 && (
                    <div className={styles.emptyState}>
                      No assets matched this filter. Try another media type or clear the search.
                    </div>
                  )}
                </section>

                <div className={styles.mediaSideStack}>
                  <section className={styles.panel}>
                    <div className={styles.mediaInspectorHeader}>
                      <div>
                        <h2 className={styles.panelTitle}>Asset Details</h2>
                        <p className={styles.mediaInspectorSubtitle}>
                          {selectedAsset ? selectedAsset.fileName : "Select a media item to inspect it."}
                        </p>
                      </div>
                      {selectedAsset && (
                        <span className={styles.mediaCountPill}>{selectedAsset.typeLabel}</span>
                      )}
                    </div>

                    <div className={styles.mediaDetailPreview}>
                      <DetailPreview asset={selectedAsset} />
                    </div>

                    {selectedAsset && (
                      <>
                        <div className={styles.mediaDetailMetaGrid}>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Source post</span>
                            <strong>{selectedAsset.postTitle}</strong>
                          </div>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Category</span>
                            <strong>{selectedAsset.category}</strong>
                          </div>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Storage</span>
                            <strong>{selectedAsset.sizeLabel}</strong>
                          </div>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Origin</span>
                            <strong>{selectedAsset.originLabel}</strong>
                          </div>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Updated</span>
                            <strong>{selectedAsset.updatedAtLabel}</strong>
                          </div>
                          <div className={styles.mediaDetailMetaRow}>
                            <span>Note</span>
                            <strong>{selectedAsset.note}</strong>
                          </div>
                        </div>

                        <div className={styles.mediaDetailActions}>
                          <Link
                            href={`/dashboard/posts/new?slug=${selectedAsset.postSlug}`}
                            className={styles.toolbarButtonPrimary}
                          >
                            <i className="fas fa-pen"></i>
                            <span>Edit Source Post</span>
                          </Link>
                          <Link
                            href={`/posts/${selectedAsset.postSlug}`}
                            className={styles.toolbarButton}
                          >
                            <i className="fas fa-eye"></i>
                            <span>Preview Post</span>
                          </Link>
                          <a
                            href={selectedAsset.url}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.toolbarButton}
                          >
                            <i className="fas fa-external-link-alt"></i>
                            <span>Open Asset</span>
                          </a>
                        </div>
                      </>
                    )}
                  </section>

                  <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>Storage Breakdown</h2>
                      <span className={styles.panelLink}>{initialMedia.storage.usedLabel}</span>
                    </div>

                    <div className={styles.mediaStorageSummary}>
                      <span>{initialMedia.storage.managedCount} managed uploads</span>
                      <span>{initialMedia.storage.linkedCount} linked references</span>
                    </div>

                    <div className={styles.mediaStorageList}>
                      {initialMedia.storage.breakdown.map((entry) => (
                        <div key={entry.key} className={styles.mediaStorageRow}>
                          <div className={styles.mediaStorageRowHeader}>
                            <span>{entry.label}</span>
                            <strong>{entry.bytesLabel}</strong>
                          </div>
                          <div className={styles.mediaStorageTrack}>
                            <div
                              className={styles.mediaStorageBar}
                              style={{ width: `${entry.percent}%`, background: entry.accent }}
                            ></div>
                          </div>
                          <div className={styles.mediaStorageRowFooter}>
                            <span>{entry.count} assets</span>
                            <span>{entry.percent}% of library</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>Collections</h2>
                    </div>

                    <div className={styles.mediaCollectionList}>
                      {initialMedia.collections.map((collection) => (
                        <div key={collection.id} className={styles.mediaCollectionCard}>
                          <div className={styles.mediaCollectionThumb}>
                            <img
                              src={collection.coverUrl}
                              alt={collection.label}
                              className={styles.mediaCollectionImage}
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <h3 className={styles.mediaCollectionTitle}>{collection.label}</h3>
                            <p className={styles.mediaCollectionMeta}>{collection.detail}</p>
                          </div>
                          <span
                            className={styles.mediaCollectionTag}
                            style={{ color: collection.accent }}
                          >
                            {collection.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className={styles.mediaBottomRow}>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Recent Activity</h2>
                  </div>

                  <div className={styles.mediaActivityList}>
                    {initialMedia.activity.map((item) => (
                      <div key={item.id} className={styles.mediaActivityRow}>
                        <span
                          className={styles.mediaActivityDot}
                          style={{ background: item.accent }}
                        ></span>
                        <div className={styles.mediaActivityTextWrap}>
                          <span>{item.text}</span>
                          <small>{item.meta}</small>
                        </div>
                        <span className={styles.mediaActivityTime}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Upload Flow</h2>
                  </div>

                  <div className={styles.mediaGuideList}>
                    {initialMedia.guide.map((item) => (
                      <div key={item.id} className={styles.mediaGuideItem}>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className={styles.mediaNotice}>
                    <i className="fas fa-info-circle" aria-hidden="true"></i>
                    <span>{initialMedia.notice}</span>
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
