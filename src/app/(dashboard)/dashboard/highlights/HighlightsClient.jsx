"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/dashboard/components/dashboard.module.css";
import hStyles from "./highlights.module.css";
import Sidebar from "@/dashboard/components/Sidebar";
import {
  createPostSelectOption,
  DashboardPostPicker,
  DashboardSelect,
} from "@/dashboard/components/DashboardSelect";
import { useAuth } from "@/frontend/lib/authContext";
import { useNotifications } from "@/dashboard/lib/notificationsContext";

import { useDashboardSettings } from "../ClientLayout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function formatLongDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return "";
  }
}

export default function HighlightsClient({
  navItems,
  isDarkInitial,
  initialNotifications,
  initialSettings,
  posts = [],
  defaultHeroPostSlugs = [],
  defaultPopularPostSlugs = [],
  defaultRandomPostSlugs = [],
  defaultHomeSlides = [],
}) {
  const { user, logout } = useAuth();
  const [localPosts, setLocalPosts] = useState(posts);
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSettings();
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Status Alerts
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Active sub-tab under Layout: "home_slider" (Homepage slider), "about" (About us), "contact" (Contact us), "homepage" (Widgets)
  const [activeTab, setActiveTab] = useState("home_slider");

  const activeSlugs = new Set((posts || []).map((p) => p.slug).filter(Boolean));

  // State for homepage sliders and widgets overrides
  const [homepageHeroPostSlugs, setHomepageHeroPostSlugs] = useState(() => {
    const raw = initialSettings?.homepageHeroPostSlugs || [];
    return raw.filter((slug) => activeSlugs.has(slug));
  });
  const [homepagePopularPostSlugs, setHomepagePopularPostSlugs] = useState(() => {
    const raw = initialSettings?.homepagePopularPostSlugs || [];
    return raw.filter((slug) => activeSlugs.has(slug));
  });
  const [homepageRandomPostSlugs, setHomepageRandomPostSlugs] = useState(() => {
    const raw = initialSettings?.homepageRandomPostSlugs || [];
    return raw.filter((slug) => activeSlugs.has(slug));
  });

  // State for homepage custom slides (initialized with custom slides, falls back to default slides if empty)
  const [homeSlides, setHomeSlides] = useState(() => {
    const custom = initialSettings?.homeSlides || [];
    const baseSlides = custom.length > 0 ? custom : defaultHomeSlides;

    const isPostLinkActive = (link) => {
      if (!link) return true;
      if (link.startsWith("http://") || link.startsWith("https://")) return true;
      if (link.startsWith("/") && !link.startsWith("/posts/")) return true;

      let slug = link;
      if (slug.startsWith("/posts/")) {
        slug = slug.replace("/posts/", "");
      } else if (slug.startsWith("posts/")) {
        slug = slug.replace("posts/", "");
      }

      if (slug && !slug.includes("/")) {
        return activeSlugs.has(slug);
      }
      return true;
    };

    const filteredBaseSlides = baseSlides.filter((slide) => isPostLinkActive(slide.link));

    // Find all featured database posts
    const featuredDb = posts.filter((p) => p.isFeatured);

    // Map them to slide objects if they are not already in filteredBaseSlides
    const baseLinks = new Set(filteredBaseSlides.map((s) => s.link).filter(Boolean));
    const dbSlides = featuredDb
      .filter((p) => !baseLinks.has(p.slug) && !baseLinks.has(`/posts/${p.slug}`) && !baseLinks.has(`posts/${p.slug}`))
      .map((p) => ({
        image: p.image || "",
        label: p.category || "General",
        title: p.title || "",
        author: p.author || "Admin",
        date: formatLongDate(p.publishedAt),
        buttonText: "Read More",
        link: p.slug || "",
      }));

    return [...filteredBaseSlides, ...dbSlides];
  });

  // State for About Us and Contact Us sliders
  const [aboutSlides, setAboutSlides] = useState(initialSettings?.aboutSlides || []);
  const [contactSlides, setContactSlides] = useState(initialSettings?.contactSlides || []);

  // File uploading states
  const [uploadingIndexes, setUploadingIndexes] = useState({});

  // Slide accordion expanded states
  const [expandedHomeSlides, setExpandedHomeSlides] = useState({ 0: true });
  const [expandedAboutSlides, setExpandedAboutSlides] = useState({ 0: true });
  const [expandedContactSlides, setExpandedContactSlides] = useState({ 0: true });

  useEffect(() => {
    // Sync theme with cookie on mount
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const currentTheme = match ? decodeURIComponent(match[1]) : "";
    const isDarkCookie = currentTheme === "dark";
    if (isDarkCookie !== isDark) {
      setTimeout(() => {
        setIsDark(isDarkCookie);
      }, 0);
    }
  }, [isDark]);

  useEffect(() => {
    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsSearchOpen(false);
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

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
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

  // Auto-clear alert messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

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
    setIsNotificationsOpen((current) => !current);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((current) => {
      const next = !current;
      if (next) {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
      return next;
    });
    setSearchQuery("");
  };

  // Image Upload Helper
  const handleSlideImageUpload = async (index, file, type) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File is too large. Max size is 5MB.");
      return;
    }

    const key = `${type}-${index}`;
    setUploadingIndexes((prev) => ({ ...prev, [key]: true }));
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("slideImage", file);

    try {
      const res = await fetch("/api/dashboard/upload-slide", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (type === "home") {
          const next = [...homeSlides];
          next[index] = { ...next[index], image: data.url };
          setHomeSlides(next);
        } else if (type === "about") {
          const next = [...aboutSlides];
          next[index] = { ...next[index], image: data.url };
          setAboutSlides(next);
        } else {
          const next = [...contactSlides];
          next[index] = { ...next[index], image: data.url };
          setContactSlides(next);
        }
        setSuccessMessage("Image uploaded successfully!");
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to upload image.");
      }
    } catch {
      setErrorMessage("Network error during file upload.");
    } finally {
      setUploadingIndexes((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Reordering helpers
  const moveItem = (list, index, direction) => {
    const nextList = [...list];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return list;

    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    return nextList;
  };

  // Save Settings API Request
  const saveSettings = async (payload) => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage("Highlights configuration saved successfully!");
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to save configurations.");
      }
    } catch {
      setErrorMessage("Network error saving configurations.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePostFeatured = async (post, newFeaturedValue) => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // 1. Fetch full post details
      const getRes = await fetch(`/api/dashboard/posts/${post.slug}`);
      if (!getRes.ok) {
        throw new Error("Failed to fetch current post details.");
      }
      const getData = await getRes.json();
      const fullPost = getData.post;

      // 2. Build FormData
      const formData = new FormData();
      formData.append("title", fullPost.title);
      formData.append("slug", fullPost.slug);
      formData.append("category", fullPost.category);
      formData.append("excerpt", fullPost.excerpt);
      formData.append("content", fullPost.content);
      formData.append("status", fullPost.status);
      formData.append("format", fullPost.format);
      formData.append("imageUrl", fullPost.image || "");
      formData.append("videoUrl", fullPost.videoUrl || "");
      formData.append("audioUrl", fullPost.audioUrl || "");
      formData.append("tags", Array.isArray(fullPost.tags) ? fullPost.tags.join(", ") : (fullPost.tags || ""));
      formData.append("isFeatured", newFeaturedValue ? "true" : "false");
      formData.append("isSticky", fullPost.isSticky ? "true" : "false");
      formData.append("seoTitle", fullPost.seoTitle || "");
      formData.append("seoDescription", fullPost.seoDescription || "");
      formData.append("ogImage", fullPost.ogImage || "");
      formData.append("galleryItems", JSON.stringify(fullPost.gallery || []));
      formData.append("extraImages", JSON.stringify(fullPost.extraImages || []));

      // 3. Send PUT request
      const putRes = await fetch(`/api/dashboard/posts/${post.slug}`, {
        method: "PUT",
        body: formData,
      });

      if (putRes.ok) {
        const putData = await putRes.json();
        setLocalPosts((prev) =>
          prev.map((p) =>
            p.slug === post.slug ? { ...p, isFeatured: newFeaturedValue } : p
          )
        );
        // Local state is updated. No success message is shown until Save is clicked.
      } else {
        const errData = await putRes.json();
        setErrorMessage(errData.error || "Failed to update post status.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Network error updating post.");
    } finally {
      setIsSaving(false);
    }
  };

  // Form Submissions
  const handleHomepageSave = (e) => {
    e.preventDefault();
    saveSettings({
      homepageHeroPostSlugs,
      homepagePopularPostSlugs,
      homepageRandomPostSlugs,
    });
  };

  const handleHomeSliderSave = (e) => {
    e.preventDefault();
    saveSettings({ homeSlides });
  };

  const handleAboutSave = (e) => {
    e.preventDefault();
    saveSettings({ aboutSlides });
  };

  const handleContactSave = (e) => {
    e.preventDefault();
    saveSettings({ contactSlides });
  };

  // Homepage custom slides operations
  const addHomeSlide = () => {
    const newSlide = {
      image: "",
      label: "",
      title: "",
      buttonText: "",
      author: "",
      date: "",
      link: ""
    };
    setHomeSlides([...homeSlides, newSlide]);
    setExpandedHomeSlides((prev) => ({ ...prev, [homeSlides.length]: true }));
  };

  // Delete confirmation state (slides and widgets)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const handleDeleteSlideClick = (index, type) => {
    if (type === "about" && aboutSlides.length <= 1) {
      alert("A slider must contain at least one slide.");
      return;
    }
    if (type === "contact" && contactSlides.length <= 1) {
      alert("A slider must contain at least one slide.");
      return;
    }
    setDeleteConfirmation({ type: "slide", index, slideType: type });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === "slide") {
      const { index, slideType } = deleteConfirmation;
      if (slideType === "home") {
        const slideToDelete = homeSlides[index];
        const next = homeSlides.filter((_, idx) => idx !== index);
        setHomeSlides(next);

        if (slideToDelete && slideToDelete.link) {
          const matchedPost = localPosts.find(
            (p) =>
              p.slug === slideToDelete.link ||
              `/posts/${p.slug}` === slideToDelete.link ||
              `posts/${p.slug}` === slideToDelete.link
          );
          if (matchedPost) {
            handleTogglePostFeatured(matchedPost, false);
          }
        }
      } else if (slideType === "about") {
        const next = aboutSlides.filter((_, idx) => idx !== index);
        setAboutSlides(next);
      } else if (slideType === "contact") {
        const next = contactSlides.filter((_, idx) => idx !== index);
        setContactSlides(next);
      }
    } else if (deleteConfirmation.type === "widget") {
      const { slug, widgetType } = deleteConfirmation;
      if (widgetType === "popular") {
        const next = homepagePopularPostSlugs.filter((s) => s !== slug);
        setHomepagePopularPostSlugs(next);
        saveSettings({
          homepageHeroPostSlugs,
          homepagePopularPostSlugs: next,
          homepageRandomPostSlugs,
        });
      } else if (widgetType === "random") {
        const next = homepageRandomPostSlugs.filter((s) => s !== slug);
        setHomepageRandomPostSlugs(next);
        saveSettings({
          homepageHeroPostSlugs,
          homepagePopularPostSlugs,
          homepageRandomPostSlugs: next,
        });
      }
    }

    setDeleteConfirmation(null);
  };

  // About slides operations
  const addAboutSlide = () => {
    const newSlide = {
      image: "",
      label: "",
      title: "",
      buttonText: "",
      targetId: "",
      author: "",
      date: "",
    };
    setAboutSlides([...aboutSlides, newSlide]);
    setExpandedAboutSlides((prev) => ({ ...prev, [aboutSlides.length]: true }));
  };

  // Contact slides operations
  const addContactSlide = () => {
    const newSlide = {
      image: "",
      label: "",
      title: "",
      buttonText: "",
      author: "",
      date: "",
    };
    setContactSlides([...contactSlides, newSlide]);
    setExpandedContactSlides((prev) => ({ ...prev, [contactSlides.length]: true }));
  };

  // Resolve posts selected for widgets list
  const selectedPopularPosts = homepagePopularPostSlugs
    .map((slug) => localPosts.find((p) => p.slug === slug))
    .filter(Boolean);

  const selectedRandomPosts = homepageRandomPostSlugs
    .map((slug) => localPosts.find((p) => p.slug === slug))
    .filter(Boolean);

  const aboutTargetOptions = [
    { value: "mission-section", label: "Our Mission (#mission-section)" },
    { value: "story-section", label: "Our Story (#story-section)" },
    { value: "team-section", label: "Meet The Team (#team-section)" },
    { value: "custom", label: "Custom ID..." },
  ];

  const popularPostOptions = useMemo(
    () =>
      localPosts
        .filter((post) => post.status === "published" && !homepagePopularPostSlugs.includes(post.slug))
        .map(createPostSelectOption),
    [localPosts, homepagePopularPostSlugs]
  );

  const randomPostOptions = useMemo(
    () =>
      localPosts
        .filter((post) => post.status === "published" && !homepageRandomPostSlugs.includes(post.slug))
        .map(createPostSelectOption),
    [localPosts, homepageRandomPostSlugs]
  );

  const unfeaturedPostOptions = useMemo(
    () =>
      localPosts
        .filter((post) => !post.isFeatured)
        .map(createPostSelectOption),
    [localPosts]
  );

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}>
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/highlights"
          />

          <div className={styles.mainWrapper}>
            {/* Topbar */}
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

                {/* Notifications dropdown wrapper */}
                <div className={styles.topOverlay} ref={notificationsRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Notifications"
                    onClick={handleNotificationsToggle}
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
                            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
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

                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search highlights"
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>

                {/* Profile dropdown */}
                <div className={styles.topOverlay} ref={profileRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isProfileOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Profile"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    {user?.avatar ? (
                      <div style={{ position: "relative", width: "20px", height: "20px", borderRadius: "50%", overflow: "hidden", display: "inline-block" }}>
                        <Image
                          src={user.avatar}
                          alt="Profile"
                          fill
                          sizes="20px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </button>
                  {isProfileOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileDropdownHeader}>
                        <div className={styles.profileDropdownAvatar} style={{ position: "relative", overflow: "hidden" }}>
                          {user?.avatar ? (
                            <Image src={user.avatar} alt="Profile" fill sizes="60px" style={{ objectFit: "cover" }} />
                          ) : (
                            <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
                          )}
                        </div>
                        <div className={styles.profileDropdownInfo}>
                          <h4 className={styles.profileDropdownName}>{user?.name || "User Admin"}</h4>
                          <p className={styles.profileDropdownEmail}>{user?.email || "admin@example.com"}</p>
                        </div>
                      </div>
                      <div className={styles.profileDropdownLinks}>
                        <Link href="/dashboard/settings" className={styles.profileDropdownLink} onClick={() => setIsProfileOpen(false)}>
                          <i className="fas fa-cog"></i>
                          <span>Profile Settings</span>
                        </Link>
                      </div>
                      <div className={styles.profileDropdownFooter}>
                        <button type="button" className={styles.profileDropdownLogout} onClick={logout}>
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
                    placeholder="Search highlights..."
                    aria-label="Search highlights"
                  />
                </div>
              </div>
            )}

            {/* Content Area */}
            <main className={styles.content}>
              <div className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>Sliders & Widgets</h1>
                  <p className={styles.subtitle}>
                    Customize hero slides and layout widget overrides for your homepage, about page, and contact page.
                  </p>
                </div>
              </div>

              {/* Inline alerts removed in favor of floating toasts */}

              {/* Tab Navigation */}
              <div className={hStyles.subTabBar}>
                <button
                  type="button"
                  className={`${hStyles.subTabBtn} ${activeTab === "home_slider" ? hStyles.subTabBtnActive : ""}`}
                  onClick={() => setActiveTab("home_slider")}
                >
                  <i className="fas fa-images" style={{ marginRight: "6px" }} />
                  Homepage Hero Slider
                </button>
                <button
                  type="button"
                  className={`${hStyles.subTabBtn} ${activeTab === "about" ? hStyles.subTabBtnActive : ""}`}
                  onClick={() => setActiveTab("about")}
                >
                  <i className="fas fa-address-card" style={{ marginRight: "6px" }} />
                  About Page Slider
                </button>
                <button
                  type="button"
                  className={`${hStyles.subTabBtn} ${activeTab === "contact" ? hStyles.subTabBtnActive : ""}`}
                  onClick={() => setActiveTab("contact")}
                >
                  <i className="fas fa-envelope-open-text" style={{ marginRight: "6px" }} />
                  Contact Page Slider
                </button>
                <button
                  type="button"
                  className={`${hStyles.subTabBtn} ${activeTab === "homepage" ? hStyles.subTabBtnActive : ""}`}
                  onClick={() => setActiveTab("homepage")}
                >
                  <i className="fas fa-th-list" style={{ marginRight: "6px" }} />
                  Homepage Highlights & Widgets
                </button>
              </div>

              {/* Tab Panels */}
              {activeTab === "homepage" && (
                <form onSubmit={handleHomepageSave} className={hStyles.container}>
                  {/* Popular Posts override */}
                  <div className={hStyles.sectionCard}>
                    <h2 className={hStyles.sectionTitle}>
                      <i className="fas fa-fire" style={{ color: "var(--dashboard-accent)" }} />
                      Homepage Popular Posts
                    </h2>
                    <p className={hStyles.sectionSubtitle}>
                      Manually select which posts appear in the Popular Posts widget (sidebar or footer widgets). If empty, they are dynamically ordered by view count.
                    </p>

                    <div className={hStyles.selectorContainer}>
                      <DashboardPostPicker
                        inputId="homepage-popular-post-picker"
                        options={popularPostOptions}
                        placeholder="Search and select posts to add to Popular Posts..."
                        onSelect={(option) => {
                          const next = [...homepagePopularPostSlugs, option.value];
                          setHomepagePopularPostSlugs(next);
                          saveSettings({
                            homepageHeroPostSlugs,
                            homepagePopularPostSlugs: next,
                            homepageRandomPostSlugs,
                          });
                        }}
                      />

                      <div className={hStyles.selectedList}>
                        {selectedPopularPosts.map((post, idx) => {
                          const matchesSearch = !searchQuery ||
                            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.category.toLowerCase().includes(searchQuery.toLowerCase());
                          if (!matchesSearch) return null;
                          return (
                            <div key={post.slug} className={hStyles.selectedItemRow}>
                              <div className={hStyles.itemInfo}>
                                {post.image && (
                                  <div style={{ position: "relative", width: "50px", height: "34px", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                                    <Image src={post.image} alt="" fill sizes="50px" style={{ objectFit: "cover" }} />
                                  </div>
                                )}
                                <div className={hStyles.itemDetails}>
                                  <span className={hStyles.itemTitle}>{post.title}</span>
                                  <span className={hStyles.itemMeta}>{post.category} • {post.slug}</span>
                                </div>
                              </div>
                              <div className={hStyles.itemActions}>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const next = moveItem(homepagePopularPostSlugs, idx, -1);
                                    setHomepagePopularPostSlugs(next);
                                    saveSettings({
                                      homepageHeroPostSlugs,
                                      homepagePopularPostSlugs: next,
                                      homepageRandomPostSlugs,
                                    });
                                  }}
                                  title="Move Up"
                                >
                                  <i className="fas fa-arrow-up" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === homepagePopularPostSlugs.length - 1}
                                  onClick={() => {
                                    const next = moveItem(homepagePopularPostSlugs, idx, 1);
                                    setHomepagePopularPostSlugs(next);
                                    saveSettings({
                                      homepageHeroPostSlugs,
                                      homepagePopularPostSlugs: next,
                                      homepageRandomPostSlugs,
                                    });
                                  }}
                                  title="Move Down"
                                >
                                  <i className="fas fa-arrow-down" />
                                </button>
                                <button
                                  type="button"
                                  className={`${hStyles.actionBtn} ${hStyles.actionBtnDanger}`}
                                  onClick={() => {
                                    setDeleteConfirmation({
                                      type: "widget",
                                      widgetType: "popular",
                                      slug: post.slug,
                                      postTitle: post.title,
                                    });
                                  }}
                                  title="Remove"
                                >
                                  <i className="fas fa-trash-alt" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {selectedPopularPosts.length === 0 && (
                          <div className={hStyles.emptyWidgetList}>
                            No custom posts selected. Falls back to sorting by most viewed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Random Posts override */}
                  <div className={hStyles.sectionCard}>
                    <h2 className={hStyles.sectionTitle}>
                      <i className="fas fa-random" style={{ color: "var(--dashboard-accent)" }} />
                      Homepage Random Posts
                    </h2>
                    <p className={hStyles.sectionSubtitle}>
                      Manually select which posts appear in the Random Posts widget. If empty, the widgets dynamically rotate articles daily.
                    </p>

                    <div className={hStyles.selectorContainer}>
                      <DashboardPostPicker
                        inputId="homepage-random-post-picker"
                        options={randomPostOptions}
                        placeholder="Search and select posts to add to Random Posts..."
                        onSelect={(option) => {
                          const next = [...homepageRandomPostSlugs, option.value];
                          setHomepageRandomPostSlugs(next);
                          saveSettings({
                            homepageHeroPostSlugs,
                            homepagePopularPostSlugs,
                            homepageRandomPostSlugs: next,
                          });
                        }}
                      />

                      <div className={hStyles.selectedList}>
                        {selectedRandomPosts.map((post, idx) => {
                          const matchesSearch = !searchQuery ||
                            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.category.toLowerCase().includes(searchQuery.toLowerCase());
                          if (!matchesSearch) return null;
                          return (
                            <div key={post.slug} className={hStyles.selectedItemRow}>
                              <div className={hStyles.itemInfo}>
                                {post.image && (
                                  <div style={{ position: "relative", width: "50px", height: "34px", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                                    <Image src={post.image} alt="" fill sizes="50px" style={{ objectFit: "cover" }} />
                                  </div>
                                )}
                                <div className={hStyles.itemDetails}>
                                  <span className={hStyles.itemTitle}>{post.title}</span>
                                  <span className={hStyles.itemMeta}>{post.category} • {post.slug}</span>
                                </div>
                              </div>
                              <div className={hStyles.itemActions}>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const next = moveItem(homepageRandomPostSlugs, idx, -1);
                                    setHomepageRandomPostSlugs(next);
                                    saveSettings({
                                      homepageHeroPostSlugs,
                                      homepagePopularPostSlugs,
                                      homepageRandomPostSlugs: next,
                                    });
                                  }}
                                  title="Move Up"
                                >
                                  <i className="fas fa-arrow-up" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === homepageRandomPostSlugs.length - 1}
                                  onClick={() => {
                                    const next = moveItem(homepageRandomPostSlugs, idx, 1);
                                    setHomepageRandomPostSlugs(next);
                                    saveSettings({
                                      homepageHeroPostSlugs,
                                      homepagePopularPostSlugs,
                                      homepageRandomPostSlugs: next,
                                    });
                                  }}
                                  title="Move Down"
                                >
                                  <i className="fas fa-arrow-down" />
                                </button>
                                <button
                                  type="button"
                                  className={`${hStyles.actionBtn} ${hStyles.actionBtnDanger}`}
                                  onClick={() => {
                                    setDeleteConfirmation({
                                      type: "widget",
                                      widgetType: "random",
                                      slug: post.slug,
                                      postTitle: post.title,
                                    });
                                  }}
                                  title="Remove"
                                >
                                  <i className="fas fa-trash-alt" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {selectedRandomPosts.length === 0 && (
                          <div className={hStyles.emptyWidgetList}>
                            No custom posts selected. Falls back to automatic daily rotation.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <button
                      type="submit"
                      className={styles.toolbarButtonPrimary}
                      disabled={isSaving}
                      style={{ cursor: isSaving ? "not-allowed" : "pointer" }}
                    >
                      <i className={`fas fa-${isSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                      <span>{isSaving ? "Saving Highlights..." : "Save Highlights"}</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "home_slider" && (
                <div className={hStyles.container}>
                  <div className={hStyles.sectionCard}>
                    <div className={hStyles.sectionCardHeader}>
                      <h2 className={hStyles.sectionTitle}>
                        <i className="fas fa-images" style={{ color: "var(--dashboard-accent)" }} />
                        Homepage Hero Slider
                      </h2>
                      <div className={hStyles.headerControlGroup}>
                        <div className={hStyles.postPickerWrapper} onClick={(e) => e.stopPropagation()}>
                          <DashboardPostPicker
                            inputId="featured-post-picker"
                            options={unfeaturedPostOptions}
                            placeholder="Feature a database post..."
                            onSelect={async (option) => {
                              const post = localPosts.find((p) => p.slug === option.value);
                              if (post) {
                                await handleTogglePostFeatured(post, true);
                                const newSlide = {
                                  image: post.image || "",
                                  label: post.category || "General",
                                  title: post.title || "",
                                  author: post.author || "Admin",
                                  date: formatLongDate(post.publishedAt),
                                  buttonText: "Read More",
                                  link: post.slug || "",
                                };
                                const updatedHomeSlides = [...homeSlides, newSlide];
                                setHomeSlides(updatedHomeSlides);
                                saveSettings({ homeSlides: updatedHomeSlides });
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addHomeSlide}
                          className={`${styles.toolbarButtonPrimary} ${hStyles.addCustomSlideBtn}`}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          <i className="fas fa-plus" />
                          <span>Add Custom Slide</span>
                        </button>
                      </div>
                    </div>
                    <p className={hStyles.sectionSubtitle}>
                      Manage the slides shown in your homepage hero section. You can create custom static slides or feature posts from your database.
                    </p>

                    <form onSubmit={handleHomeSliderSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                      <div className={hStyles.slideList}>
                        {homeSlides.map((slide, idx) => {
                          const matchesSearch = !searchQuery ||
                            slide.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            slide.label?.toLowerCase().includes(searchQuery.toLowerCase());
                          if (!matchesSearch) return null;

                          const isExpanded = !!expandedHomeSlides[idx];
                          const uploadKey = `home-${idx}`;
                          const isUploading = !!uploadingIndexes[uploadKey];

                          return (
                            <div key={idx} className={hStyles.slideCard}>
                              {/* Accordion Header */}
                              <div
                                className={hStyles.slideCardHeader}
                                onClick={() =>
                                  setExpandedHomeSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                }
                              >
                                <div className={hStyles.slideCardHeaderLeft}>
                                  <span className={hStyles.slideIndexBadge}>Slide {idx + 1}</span>
                                  <span className={hStyles.slideCardTitle}>
                                    {slide.title || "(Untitled Slide)"}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={hStyles.actionBtn}
                                    disabled={idx === 0}
                                    onClick={() => setHomeSlides(moveItem(homeSlides, idx, -1))}
                                  >
                                    <i className="fas fa-arrow-up" />
                                  </button>
                                  <button
                                    type="button"
                                    className={hStyles.actionBtn}
                                    disabled={idx === homeSlides.length - 1}
                                    onClick={() => setHomeSlides(moveItem(homeSlides, idx, 1))}
                                  >
                                    <i className="fas fa-arrow-down" />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${hStyles.actionBtn} ${hStyles.actionBtnDanger}`}
                                    onClick={() => handleDeleteSlideClick(idx, "home")}
                                  >
                                    <i className="fas fa-trash-alt" />
                                  </button>
                                  <button
                                    type="button"
                                    className={hStyles.actionBtn}
                                    onClick={() =>
                                      setExpandedHomeSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                    }
                                  >
                                    <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`} />
                                  </button>
                                </div>
                              </div>

                              {/* Accordion Body */}
                              {isExpanded && (
                                <div className={hStyles.slideCardBody}>
                                  {/* Image upload and URL row */}
                                  <div className={hStyles.slideImageWidget}>
                                    <div className={hStyles.slideThumbContainer}>
                                      <Image
                                        src={slide.image || "/images/placeholder-image.jpg"}
                                        alt=""
                                        fill
                                        sizes="120px"
                                        style={{ objectFit: "cover" }}
                                      />
                                      <label className={hStyles.slideUploadOverlay} htmlFor={`home-upload-${idx}`}>
                                        <i className={`fas fa-camera ${hStyles.uploadIcon}`} />
                                        <input
                                          type="file"
                                          id={`home-upload-${idx}`}
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onChange={(e) =>
                                            handleSlideImageUpload(idx, e.target.files?.[0], "home")
                                          }
                                        />
                                      </label>
                                      {isUploading && (
                                        <div className={hStyles.slideThumbUploading}>
                                          <i className="fas fa-spinner fa-spin" style={{ color: "#fff" }} />
                                        </div>
                                      )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                      <div className={styles.settingsFormGroup}>
                                        <label className={styles.settingsLabel}>Image URL</label>
                                        <input
                                          type="text"
                                          className={styles.settingsInput}
                                          value={slide.image || ""}
                                          onChange={(e) => {
                                            const next = [...homeSlides];
                                            next[idx] = { ...next[idx], image: e.target.value };
                                            setHomeSlides(next);
                                          }}
                                          placeholder="Or paste an image URL here..."
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Form Fields Grid */}
                                  <div className={hStyles.slideFormGrid}>
                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Title</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.title || ""}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], title: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="Slide Title text"
                                        required
                                      />
                                    </div>

                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Category Label</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.label || ""}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], label: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="e.g. Lifestyle"
                                        required
                                      />
                                    </div>

                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Admin Name (Author)</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.author || "Admin"}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], author: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="e.g. Admin"
                                        required
                                      />
                                    </div>

                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Date</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.date || "May 29, 2026"}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], date: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="e.g. May 29, 2026"
                                        required
                                      />
                                    </div>

                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Button Text</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.buttonText || "Read More"}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], buttonText: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="e.g. Read More"
                                        required
                                      />
                                    </div>

                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Target Link (Post slug or custom URL)</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.link || ""}
                                        onChange={(e) => {
                                          const next = [...homeSlides];
                                          next[idx] = { ...next[idx], link: e.target.value };
                                          setHomeSlides(next);
                                        }}
                                        placeholder="e.g. how-minimalism-helps-me-stay-calm or /about-us"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {homeSlides.length === 0 && (
                        <div className={hStyles.emptyWidgetList} style={{ marginTop: "12px" }}>
                          No custom slides added. Homepage hero slider will fall back to using your selected highlights or featured posts.
                        </div>
                      )}

                      {/* Save Button */}
                      <div style={{ marginTop: "20px" }}>
                        <button
                          type="submit"
                          className={styles.toolbarButtonPrimary}
                          disabled={isSaving}
                          style={{ cursor: isSaving ? "not-allowed" : "pointer" }}
                        >
                          <i className={`fas fa-${isSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                          <span>{isSaving ? "Saving Slider..." : "Save Homepage Slider"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "about" && (
                <form onSubmit={handleAboutSave} className={hStyles.container}>
                  <div className={hStyles.sectionCard}>
                    <div className={hStyles.sectionCardHeader}>
                      <h2 className={hStyles.sectionTitle}>
                        <i className="fas fa-address-card" style={{ color: "var(--dashboard-accent)" }} />
                        About Us Slides
                      </h2>
                      <button
                        type="button"
                        onClick={addAboutSlide}
                        className={styles.toolbarButtonPrimary}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <i className="fas fa-plus" />
                        <span>Add Slide</span>
                      </button>
                    </div>

                    <div className={hStyles.slideList}>
                      {aboutSlides.map((slide, idx) => {
                        const matchesSearch = !searchQuery ||
                          slide.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          slide.label?.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchesSearch) return null;

                        const isExpanded = !!expandedAboutSlides[idx];
                        const uploadKey = `about-${idx}`;
                        const isUploading = !!uploadingIndexes[uploadKey];

                        return (
                          <div key={idx} className={hStyles.slideCard}>
                            {/* Accordion Header */}
                            <div
                              className={hStyles.slideCardHeader}
                              onClick={() =>
                                setExpandedAboutSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                            >
                              <div className={hStyles.slideCardHeaderLeft}>
                                <span className={hStyles.slideIndexBadge}>Slide {idx + 1}</span>
                                <span className={hStyles.slideCardTitle}>
                                  {slide.title || "(Untitled Slide)"}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === 0}
                                  onClick={() => setAboutSlides(moveItem(aboutSlides, idx, -1))}
                                >
                                  <i className="fas fa-arrow-up" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === aboutSlides.length - 1}
                                  onClick={() => setAboutSlides(moveItem(aboutSlides, idx, 1))}
                                >
                                  <i className="fas fa-arrow-down" />
                                </button>
                                <button
                                  type="button"
                                  className={`${hStyles.actionBtn} ${hStyles.actionBtnDanger}`}
                                  onClick={() => handleDeleteSlideClick(idx, "about")}
                                >
                                  <i className="fas fa-trash-alt" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  onClick={() =>
                                    setExpandedAboutSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                  }
                                >
                                  <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`} />
                                </button>
                              </div>
                            </div>

                            {/* Accordion Body */}
                            {isExpanded && (
                              <div className={hStyles.slideCardBody}>
                                {/* Image upload and URL row */}
                                <div className={hStyles.slideImageWidget}>
                                  <div className={hStyles.slideThumbContainer}>
                                    <Image
                                      src={slide.image || "/images/placeholder-image.jpg"}
                                      alt=""
                                      fill
                                      sizes="120px"
                                      style={{ objectFit: "cover" }}
                                    />
                                    <label className={hStyles.slideUploadOverlay} htmlFor={`about-upload-${idx}`}>
                                      <i className={`fas fa-camera ${hStyles.uploadIcon}`} />
                                      <input
                                        type="file"
                                        id={`about-upload-${idx}`}
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) =>
                                          handleSlideImageUpload(idx, e.target.files?.[0], "about")
                                        }
                                      />
                                    </label>
                                    {isUploading && (
                                      <div className={hStyles.slideThumbUploading}>
                                        <i className="fas fa-spinner fa-spin" style={{ color: "#fff" }} />
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ flex: 1 }}>
                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Image URL</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.image || ""}
                                        onChange={(e) => {
                                          const next = [...aboutSlides];
                                          next[idx] = { ...next[idx], image: e.target.value };
                                          setAboutSlides(next);
                                        }}
                                        placeholder="Or paste an image URL here..."
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className={hStyles.slideFormGrid}>
                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Title</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.title || ""}
                                      onChange={(e) => {
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], title: e.target.value };
                                        setAboutSlides(next);
                                      }}
                                      placeholder="Slide Title text"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Category Label</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.label || ""}
                                      onChange={(e) => {
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], label: e.target.value };
                                        setAboutSlides(next);
                                      }}
                                      placeholder="e.g. About Us"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Admin Name (Author)</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.author || "Admin"}
                                      onChange={(e) => {
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], author: e.target.value };
                                        setAboutSlides(next);
                                      }}
                                      placeholder="e.g. Admin"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Date</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.date || "May 29, 2026"}
                                      onChange={(e) => {
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], date: e.target.value };
                                        setAboutSlides(next);
                                      }}
                                      placeholder="e.g. May 29, 2026"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Button Text</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.buttonText || ""}
                                      onChange={(e) => {
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], buttonText: e.target.value };
                                        setAboutSlides(next);
                                      }}
                                      placeholder="e.g. Our Mission"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Button Target Section</label>
                                    <DashboardSelect
                                      inputId={`about-slide-target-${idx}`}
                                      options={aboutTargetOptions}
                                      value={aboutTargetOptions.find((option) =>
                                        option.value === (["mission-section", "story-section", "team-section"].includes(slide.targetId) ? slide.targetId : "custom")
                                      )}
                                      onChange={(option) => {
                                        const val = option?.value || "custom";
                                        const next = [...aboutSlides];
                                        next[idx] = { ...next[idx], targetId: val === "custom" ? "" : val };
                                        setAboutSlides(next);
                                      }}
                                      minHeight={38}
                                      borderRadius={10}
                                      fontSize={12}
                                    />
                                    {!["mission-section", "story-section", "team-section"].includes(slide.targetId) && (
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        style={{ marginTop: "6px" }}
                                        value={slide.targetId || ""}
                                        onChange={(e) => {
                                          const next = [...aboutSlides];
                                          next[idx] = { ...next[idx], targetId: e.target.value };
                                          setAboutSlides(next);
                                        }}
                                        placeholder="Enter custom HTML ID (e.g. contact-form)"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <button
                      type="submit"
                      className={styles.toolbarButtonPrimary}
                      disabled={isSaving}
                      style={{ cursor: isSaving ? "not-allowed" : "pointer" }}
                    >
                      <i className={`fas fa-${isSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                      <span>{isSaving ? "Saving Slider..." : "Save About Slider"}</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "contact" && (
                <form onSubmit={handleContactSave} className={hStyles.container}>
                  <div className={hStyles.sectionCard}>
                    <div className={hStyles.sectionCardHeader}>
                      <h2 className={hStyles.sectionTitle}>
                        <i className="fas fa-envelope-open-text" style={{ color: "var(--dashboard-accent)" }} />
                        Contact Us Slides
                      </h2>
                      <button
                        type="button"
                        onClick={addContactSlide}
                        className={styles.toolbarButtonPrimary}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <i className="fas fa-plus" />
                        <span>Add Slide</span>
                      </button>
                    </div>

                    <div className={hStyles.slideList}>
                      {contactSlides.map((slide, idx) => {
                        const matchesSearch = !searchQuery ||
                          slide.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          slide.label?.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchesSearch) return null;

                        const isExpanded = !!expandedContactSlides[idx];
                        const uploadKey = `contact-${idx}`;
                        const isUploading = !!uploadingIndexes[uploadKey];

                        return (
                          <div key={idx} className={hStyles.slideCard}>
                            {/* Accordion Header */}
                            <div
                              className={hStyles.slideCardHeader}
                              onClick={() =>
                                setExpandedContactSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                            >
                              <div className={hStyles.slideCardHeaderLeft}>
                                <span className={hStyles.slideIndexBadge}>Slide {idx + 1}</span>
                                <span className={hStyles.slideCardTitle}>
                                  {slide.title || "(Untitled Slide)"}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === 0}
                                  onClick={() => setContactSlides(moveItem(contactSlides, idx, -1))}
                                >
                                  <i className="fas fa-arrow-up" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  disabled={idx === contactSlides.length - 1}
                                  onClick={() => setContactSlides(moveItem(contactSlides, idx, 1))}
                                >
                                  <i className="fas fa-arrow-down" />
                                </button>
                                <button
                                  type="button"
                                  className={`${hStyles.actionBtn} ${hStyles.actionBtnDanger}`}
                                  onClick={() => handleDeleteSlideClick(idx, "contact")}
                                >
                                  <i className="fas fa-trash-alt" />
                                </button>
                                <button
                                  type="button"
                                  className={hStyles.actionBtn}
                                  onClick={() =>
                                    setExpandedContactSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                  }
                                >
                                  <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`} />
                                </button>
                              </div>
                            </div>

                            {/* Accordion Body */}
                            {isExpanded && (
                              <div className={hStyles.slideCardBody}>
                                {/* Image upload and URL row */}
                                <div className={hStyles.slideImageWidget}>
                                  <div className={hStyles.slideThumbContainer}>
                                    <Image
                                      src={slide.image || "/images/placeholder-image.jpg"}
                                      alt=""
                                      fill
                                      sizes="120px"
                                      style={{ objectFit: "cover" }}
                                    />
                                    <label className={hStyles.slideUploadOverlay} htmlFor={`contact-upload-${idx}`}>
                                      <i className={`fas fa-camera ${hStyles.uploadIcon}`} />
                                      <input
                                        type="file"
                                        id={`contact-upload-${idx}`}
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) =>
                                          handleSlideImageUpload(idx, e.target.files?.[0], "contact")
                                        }
                                      />
                                    </label>
                                    {isUploading && (
                                      <div className={hStyles.slideThumbUploading}>
                                        <i className="fas fa-spinner fa-spin" style={{ color: "#fff" }} />
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ flex: 1 }}>
                                    <div className={styles.settingsFormGroup}>
                                      <label className={styles.settingsLabel}>Image URL</label>
                                      <input
                                        type="text"
                                        className={styles.settingsInput}
                                        value={slide.image || ""}
                                        onChange={(e) => {
                                          const next = [...contactSlides];
                                          next[idx] = { ...next[idx], image: e.target.value };
                                          setContactSlides(next);
                                        }}
                                        placeholder="Or paste an image URL here..."
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className={hStyles.slideFormGrid}>
                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Title</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.title || ""}
                                      onChange={(e) => {
                                        const next = [...contactSlides];
                                        next[idx] = { ...next[idx], title: e.target.value };
                                        setContactSlides(next);
                                      }}
                                      placeholder="Slide Title text"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Category Label</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.label || ""}
                                      onChange={(e) => {
                                        const next = [...contactSlides];
                                        next[idx] = { ...next[idx], label: e.target.value };
                                        setContactSlides(next);
                                      }}
                                      placeholder="e.g. Contact Us"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Admin Name (Author)</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.author || "Admin"}
                                      onChange={(e) => {
                                        const next = [...contactSlides];
                                        next[idx] = { ...next[idx], author: e.target.value };
                                        setContactSlides(next);
                                      }}
                                      placeholder="e.g. Admin"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup}>
                                    <label className={styles.settingsLabel}>Date</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.date || "May 29, 2026"}
                                      onChange={(e) => {
                                        const next = [...contactSlides];
                                        next[idx] = { ...next[idx], date: e.target.value };
                                        setContactSlides(next);
                                      }}
                                      placeholder="e.g. May 29, 2026"
                                      required
                                    />
                                  </div>

                                  <div className={styles.settingsFormGroup} style={{ gridColumn: "span 2" }}>
                                    <label className={styles.settingsLabel}>Button Text</label>
                                    <input
                                      type="text"
                                      className={styles.settingsInput}
                                      value={slide.buttonText || ""}
                                      onChange={(e) => {
                                        const next = [...contactSlides];
                                        next[idx] = { ...next[idx], buttonText: e.target.value };
                                        setContactSlides(next);
                                      }}
                                      placeholder="e.g. Send Us A Message"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <button
                      type="submit"
                      className={styles.toolbarButtonPrimary}
                      disabled={isSaving}
                      style={{ cursor: isSaving ? "not-allowed" : "pointer" }}
                    >
                      <i className={`fas fa-${isSaving ? "spinner fa-spin" : "cloud-upload-alt"}`} />
                      <span>{isSaving ? "Saving Slider..." : "Save Contact Slider"}</span>
                    </button>
                  </div>
                </form>
              )}
            </main>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmation && (
              <div
                className={styles.deleteModalOverlay}
                onClick={() => setDeleteConfirmation(null)}
              >
                <div
                  className={styles.deleteModalContainer}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* X Close button */}
                  <button
                    type="button"
                    className={styles.deleteModalCloseBtn}
                    onClick={() => setDeleteConfirmation(null)}
                    aria-label="Close"
                  >
                    <i className="fas fa-times"></i>
                  </button>

                  {/* Icon + Heading */}
                  <div className={styles.deleteModalTopSection}>
                    <div className={styles.deleteModalIconWrap}>
                      <i className="fas fa-trash-alt"></i>
                    </div>
                    <div className={styles.deleteModalHeaderContent}>
                      <h3 className={styles.deleteModalHeading}>Are you sure?</h3>
                      <p className={styles.deleteModalSubheading}>
                        {deleteConfirmation.type === "slide"
                          ? "This will permanently delete this slide. This action cannot be undone."
                          : `This will remove "${deleteConfirmation.postTitle}" from this widget. This action cannot be undone.`}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className={styles.deleteModalFooter}>
                    <button
                      type="button"
                      className={styles.deleteModalBtnCancel}
                      onClick={() => setDeleteConfirmation(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.deleteModalBtnDelete}
                      onClick={handleDeleteConfirm}
                    >
                      {deleteConfirmation.type === "slide" ? "Yes, delete" : "Yes, remove"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      {/* Toast Notifications */}
      {(successMessage || errorMessage) && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "380px",
            maxWidth: "calc(100vw - 48px)"
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes orinToastSlideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes orinToastShrink {
              from { width: 100%; }
              to { width: 0%; }
            }
            .orin-toast-item {
              animation: orinToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              background: var(--dashboard-card-bg);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid var(--dashboard-card-border);
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
              padding: 16px;
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .orin-toast-body {
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }
            .orin-toast-icon {
              font-size: 18px;
              margin-top: 2px;
            }
            .orin-toast-content {
              flex: 1;
              font-size: 13.5px;
              line-height: 1.4;
              color: var(--dashboard-text);
              font-family: var(--font-poppins), sans-serif;
            }
            .orin-toast-close {
              background: transparent;
              border: none;
              color: var(--dashboard-text-muted);
              cursor: pointer;
              font-size: 14px;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: color 0.15s ease;
              margin-top: 1px;
            }
            .orin-toast-close:hover {
              color: var(--dashboard-text);
            }
            .orin-toast-progress {
              position: absolute;
              bottom: 0;
              left: 0;
              height: 3px;
            }
          ` }} />

          {successMessage && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-check-circle" style={{ color: "var(--dashboard-accent)" }}></i>
                </div>
                <div className="orin-toast-content">
                  {successMessage}
                </div>
                <button className="orin-toast-close" onClick={() => setSuccessMessage("")} aria-label="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div
                className="orin-toast-progress"
                style={{
                  background: "var(--dashboard-accent)",
                  animation: "orinToastShrink 4000ms linear forwards"
                }}
              />
            </div>
          )}

          {errorMessage && (
            <div className="orin-toast-item">
              <div className="orin-toast-body">
                <div className="orin-toast-icon">
                  <i className="fas fa-exclamation-circle" style={{ color: "#f43f5e" }}></i>
                </div>
                <div className="orin-toast-content" style={{ fontWeight: 500 }}>
                  {errorMessage}
                </div>
                <button className="orin-toast-close" onClick={() => setErrorMessage("")} aria-label="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div
                className="orin-toast-progress"
                style={{
                  background: "#f43f5e",
                  animation: "orinToastShrink 4000ms linear forwards"
                }}
              />
            </div>
          )}
        </div>
      )}
          </div>
        </div>
      </div>
  );
}
