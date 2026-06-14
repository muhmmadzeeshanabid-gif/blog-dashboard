"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import Sidebar from "../../Sidebar";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function slugifyValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getVideoEmbedSource(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com") && parsedUrl.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsedUrl.searchParams.get("v")}`;
    }

    if (parsedUrl.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsedUrl.pathname.replace(/\//g, "")}`;
    }

    if (parsedUrl.hostname.includes("vimeo.com") && !parsedUrl.hostname.includes("player.")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url ?? ""));
}

function isDirectAudioFile(url) {
  return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(String(url ?? ""));
}

function buildInitialValues(initialPost) {
  return {
    title: initialPost?.title ?? "",
    slug: initialPost?.slug ?? "",
    category: initialPost?.category ?? "Minimalism",
    excerpt: initialPost?.excerpt ?? "",
    content: initialPost?.content ?? "",
    imageUrl: initialPost?.image ?? "",
    videoUrl: initialPost?.videoUrl ?? "",
    audioUrl: initialPost?.audioUrl ?? "",
    tags: Array.isArray(initialPost?.tags) ? initialPost.tags.join(", ") : "",
    format: initialPost?.format ?? "image",
    status: initialPost?.status ?? "draft",
    isFeatured: Boolean(initialPost?.isFeatured),
    isSticky: Boolean(initialPost?.isSticky),
  };
}

export default function PostEditorClient({
  mode,
  initialPost,
  categoryOptions,
  navItems,
  isDarkInitial,
  initialNotifications,
  initialLastUpdatedLabel,
}) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [editorMode, setEditorMode] = useState(mode);
  const [activeSlug, setActiveSlug] = useState(initialPost?.slug ?? "");
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [formValues, setFormValues] = useState(() => buildInitialValues(initialPost));
  const [hasManualSlug, setHasManualSlug] = useState(Boolean(initialPost?.slug));
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [lastSavedLabel, setLastSavedLabel] = useState(
    initialPost?.updatedAt ? formatDateTimeLabel(initialPost.updatedAt) : initialLastUpdatedLabel
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [galleryItems, setGalleryItems] = useState(() => {
    if (initialPost && Array.isArray(initialPost.gallery) && initialPost.gallery.length > 0) {
      return initialPost.gallery.map((item, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        imageUrl: item.image || "",
        text: item.text || "",
        hasFile: false,
        file: null,
        previewUrl: item.image || "",
      }));
    }
    if (initialPost && Array.isArray(initialPost.galleryImages) && initialPost.galleryImages.length > 0) {
      return initialPost.galleryImages.map((img, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        imageUrl: img || "",
        text: "",
        hasFile: false,
        file: null,
        previewUrl: img || "",
      }));
    }
    return [];
  });

  const handleAddGalleryItem = () => {
    setGalleryItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: "",
        text: "",
        hasFile: false,
        file: null,
        previewUrl: "",
      },
    ]);
  };

  const handleRemoveGalleryItem = (id) => {
    setGalleryItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target && target.previewUrl && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleGalleryItemChange = (id, field, value) => {
    setGalleryItems((current) =>
      current.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "imageUrl") {
            updated.previewUrl = value;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleGalleryItemFileChange = (id, event) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setGalleryItems((current) =>
        current.map((item) => {
          if (item.id === id) {
            if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(item.previewUrl);
            }
            return {
              ...item,
              file,
              hasFile: true,
              imageUrl: "",
              previewUrl,
            };
          }
          return item;
        })
      );
    }
  };

  const notifications = (initialNotifications ?? []).map((item) => ({
    ...item,
    unread: item.unread && !readNotificationIds.includes(item.id),
  }));
  const unreadNotifications = notifications.filter((item) => item.unread).length;
  const wordCount = useMemo(
    () =>
      formValues.content
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean).length,
    [formValues.content]
  );
  const uploadedImagePreview = useMemo(
    () => (featuredImageFile ? URL.createObjectURL(featuredImageFile) : ""),
    [featuredImageFile]
  );
  const uploadedVideoPreview = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : ""),
    [videoFile]
  );
  const uploadedAudioPreview = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : ""),
    [audioFile]
  );
  const imagePreview = uploadedImagePreview || formValues.imageUrl.trim();
  const videoPreview = uploadedVideoPreview || formValues.videoUrl.trim();
  const audioPreview = uploadedAudioPreview || formValues.audioUrl.trim();

  useEffect(() => {
    setIsDark(document.body.classList.contains("bwp-dark-style"));

    const onDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    const onDocumentMouseDown = (event) => {
      if (
        event.target instanceof Element &&
        !event.target.closest("[data-dashboard-notifications]")
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

  useEffect(() => {
    return () => {
      if (uploadedImagePreview) {
        URL.revokeObjectURL(uploadedImagePreview);
      }
    };
  }, [uploadedImagePreview]);

  useEffect(() => {
    return () => {
      if (uploadedVideoPreview) {
        URL.revokeObjectURL(uploadedVideoPreview);
      }
    };
  }, [uploadedVideoPreview]);

  useEffect(() => {
    return () => {
      if (uploadedAudioPreview) {
        URL.revokeObjectURL(uploadedAudioPreview);
      }
    };
  }, [uploadedAudioPreview]);

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const handleFormatText = (type) => {
    const textarea = document.getElementById("editor-content-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let newCursorPos = start;

    switch (type) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 9) + 2;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 11) + 1;
        break;
      case "strike":
        replacement = `~~${selectedText || "strikethrough text"}~~`;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 18) + 2;
        break;
      case "hr":
        replacement = `\n\n---\n\n`;
        newCursorPos = start + replacement.length;
        break;
      case "title":
        replacement = `\n\n## ${selectedText || "Heading"}\n\n`;
        newCursorPos = start + replacement.length;
        break;
      default:
        return;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setFormValues((prev) => ({
      ...prev,
      content: newContent,
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setSubmitError("");
    setSubmitSuccess("");

    if (name === "format") {
      if (value !== "video") {
        setVideoFile(null);
      }

      if (value !== "audio") {
        setAudioFile(null);
      }
    }

    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "title" && !hasManualSlug) {
        nextValues.slug = slugifyValue(value);
      }

      return nextValues;
    });
  };

  const handleSlugChange = (event) => {
    const nextValue = event.target.value;
    setHasManualSlug(nextValue.trim().length > 0);
    setSubmitError("");
    setSubmitSuccess("");
    setFormValues((currentValues) => ({
      ...currentValues,
      slug: nextValue,
    }));
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFeaturedImageFile(nextFile);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleVideoFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setVideoFile(nextFile);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleAudioFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setAudioFile(nextFile);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => !current);
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  const handleLogout = () => {
    router.push("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("title", formValues.title);
      payload.set("slug", formValues.slug);
      payload.set("category", formValues.category);
      payload.set("excerpt", formValues.excerpt);
      payload.set("content", formValues.content);
      payload.set("imageUrl", formValues.imageUrl);
      payload.set("videoUrl", formValues.videoUrl);
      payload.set("audioUrl", formValues.audioUrl);
      payload.set("tags", formValues.tags);
      payload.set("format", formValues.format);
      payload.set("status", formValues.status);
      payload.set("isFeatured", String(formValues.isFeatured));
      payload.set("isSticky", String(formValues.isSticky));

      if (featuredImageFile) {
        payload.set("featuredImage", featuredImageFile);
      }

      if (videoFile) {
        payload.set("videoFile", videoFile);
      }

      if (audioFile) {
        payload.set("audioFile", audioFile);
      }

      // Serialize gallery structure and append any new files
      const serializedGallery = galleryItems.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        text: item.text,
        hasFile: item.hasFile,
      }));
      payload.set("galleryItems", JSON.stringify(serializedGallery));

      galleryItems.forEach((item) => {
        if (item.file) {
          payload.set(`gallery_file_${item.id}`, item.file);
        }
      });

      const endpoint =
        editorMode === "edit" && activeSlug
          ? `/api/dashboard/posts/${activeSlug}`
          : "/api/dashboard/posts";
      const method = editorMode === "edit" && activeSlug ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        body: payload,
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error ?? "Unable to save this post right now.");
        return;
      }

      const nextPost = result.post;
      setEditorMode("edit");
      setActiveSlug(nextPost.slug);
      setHasManualSlug(true);
      setLastSavedLabel(formatDateTimeLabel(nextPost.updatedAt));
      setFormValues({
        title: nextPost.title,
        slug: nextPost.slug,
        category: nextPost.category,
        excerpt: nextPost.excerpt,
        content: nextPost.content,
        imageUrl: nextPost.image,
        videoUrl: nextPost.videoUrl ?? "",
        audioUrl: nextPost.audioUrl ?? "",
        tags: Array.isArray(nextPost.tags) ? nextPost.tags.join(", ") : "",
        format: nextPost.format,
        status: nextPost.status,
        isFeatured: Boolean(nextPost.isFeatured),
        isSticky: Boolean(nextPost.isSticky),
      });

      // Update galleryItems local state with saved URLs and clear files/blobs
      if (Array.isArray(nextPost.gallery)) {
        setGalleryItems(
          nextPost.gallery.map((item, idx) => ({
            id: `existing-${idx}-${Date.now()}`,
            imageUrl: item.image || "",
            text: item.text || "",
            hasFile: false,
            file: null,
            previewUrl: item.image || "",
          }))
        );
      }

      setFeaturedImageFile(null);
      setVideoFile(null);
      setAudioFile(null);
      setSubmitSuccess(result.message);
    } catch {
      setSubmitError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div
          className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}
        >
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
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                aria-label="Toggle sidebar"
                style={{ marginRight: "auto" }}
              >
                <i className="fas fa-bars"></i>
              </button>
              <div className={styles.topIcons}>
                <Link href="/" className={styles.iconButton} aria-label="Open website">
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
                <div className={styles.topOverlay} data-dashboard-notifications="true">
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
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
                            onClick={() =>
                              setReadNotificationIds((currentIds) =>
                                currentIds.includes(item.id)
                                  ? currentIds
                                  : [...currentIds, item.id]
                              )
                            }
                          >
                            <span className={styles.notificationDot}></span>
                            <span className={styles.notificationTextWrap}>
                              <span className={styles.notificationItemTitle}>{item.title}</span>
                              <span className={styles.notificationItemMeta}>{item.time}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/dashboard" className={styles.iconButton} aria-label="Dashboard overview">
                  <i className="fas fa-user"></i>
                </Link>
              </div>
            </div>

            <main className={styles.content}>
              <form onSubmit={handleSubmit} className={styles.editorForm}>
                <div className={styles.headingRow}>
                  <div>
                    <h1 className={styles.title}>
                      {editorMode === "edit" ? "Edit Post" : "New Post"}
                    </h1>
                    <p className={styles.subtitle}>
                      Write, publish, and manage blog content from one clean workspace.
                    </p>
                    <p className={styles.lastUpdated}>Last saved {lastSavedLabel}</p>
                  </div>

                  <div className={styles.pageActions}>
                    <Link href="/dashboard/posts" className={styles.toolbarButton}>
                      <i className="fas fa-arrow-left"></i>
                      <span>All Posts</span>
                    </Link>
                    <button
                      type="submit"
                      className={styles.toolbarButtonPrimary}
                      disabled={isSubmitting}
                    >
                      <i className={`fas fa-${isSubmitting ? "spinner fa-spin" : "save"}`}></i>
                      <span>{isSubmitting ? "Saving..." : editorMode === "edit" ? "Update Post" : "Publish Post"}</span>
                    </button>
                  </div>
                </div>

                {submitError ? (
                  <div className={`${styles.editorAlert} ${styles.editorAlertError}`}>
                    {submitError}
                  </div>
                ) : null}

                {submitSuccess ? (
                  <div className={`${styles.editorAlert} ${styles.editorAlertSuccess}`}>
                    <span>{submitSuccess}</span>
                    <div className={styles.editorAlertActions}>
                      <Link href="/dashboard/posts" className={styles.editorAlertLink}>
                        Open posts list
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className={styles.editorGrid}>
                  <section className={`${styles.panel} ${styles.editorMainPanel}`}>
                    <div className={styles.postsPanelHeader}>
                      <div>
                        <h2 className={styles.panelTitle}>Post Content</h2>
                        <p className={styles.postsPanelMeta}>
                          Everything you add here will flow into the live blog automatically.
                        </p>
                      </div>
                      <span className={styles.postsStatusChip}>
                        {formValues.status === "published" ? "Ready to publish" : "Draft mode"}
                      </span>
                    </div>

                    <div className={styles.editorFields}>
                      <label className={styles.editorField}>
                        <span className={styles.editorLabel}>Post Title</span>
                        <input
                          name="title"
                          value={formValues.title}
                          onChange={handleChange}
                          className={styles.editorInput}
                          placeholder="How Minimalism Helps Me Stay Calm"
                          autoComplete="off"
                        />
                      </label>

                      <div className={styles.editorTwoColumn}>
                        <label className={styles.editorField}>
                          <span className={styles.editorLabel}>Slug</span>
                          <input
                            name="slug"
                            value={formValues.slug}
                            onChange={handleSlugChange}
                            className={styles.editorInput}
                            placeholder="how-minimalism-helps-me-stay-calm"
                            autoComplete="off"
                          />
                        </label>
                        <label className={styles.editorField}>
                          <span className={styles.editorLabel}>Category</span>
                          <input
                            name="category"
                            value={formValues.category}
                            onChange={handleChange}
                            className={styles.editorInput}
                            list="dashboard-category-options"
                            placeholder="Minimalism"
                            autoComplete="off"
                          />
                          <datalist id="dashboard-category-options">
                            {categoryOptions.map((category) => (
                              <option key={category} value={category} />
                            ))}
                          </datalist>
                        </label>
                      </div>

                      <label className={styles.editorField}>
                        <span className={styles.editorLabel}>Excerpt</span>
                        <textarea
                          name="excerpt"
                          value={formValues.excerpt}
                          onChange={handleChange}
                          className={`${styles.editorInput} ${styles.editorTextarea} ${styles.editorTextareaCompact}`}
                          placeholder="Write a short summary that will appear on cards and listing pages."
                        />
                      </label>

                      <div className={styles.editorField}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span className={styles.editorLabel} style={{ marginBottom: 0 }}>Content</span>
                          {/* Formatting Toolbar */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            border: "1px solid var(--dashboard-border)",
                            borderRadius: "6px",
                            background: "var(--dashboard-bg-surface)",
                          }}>
                            <button
                              type="button"
                              onClick={() => handleFormatText("bold")}
                              style={{
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "none",
                                border: "none",
                                fontWeight: "bold",
                                fontSize: "14px",
                                color: "var(--dashboard-text)",
                                cursor: "pointer",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormatText("italic")}
                              style={{
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "none",
                                border: "none",
                                fontStyle: "italic",
                                fontSize: "14px",
                                color: "var(--dashboard-text)",
                                cursor: "pointer",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormatText("strike")}
                              style={{
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "none",
                                border: "none",
                                textDecoration: "line-through",
                                fontSize: "14px",
                                color: "var(--dashboard-text)",
                                cursor: "pointer",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              title="Strikethrough"
                            >
                              S
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormatText("hr")}
                              style={{
                                width: "32px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "none",
                                border: "none",
                                textDecoration: "underline",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "var(--dashboard-text)",
                                cursor: "pointer",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              title="Horizontal Rule"
                            >
                              HR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormatText("title")}
                              style={{
                                width: "36px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "none",
                                border: "none",
                                textDecoration: "underline",
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "var(--dashboard-text)",
                                cursor: "pointer",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              title="Title / Heading"
                            >
                              TITL
                            </button>
                            <div style={{ width: "1px", height: "16px", background: "var(--dashboard-border)", margin: "0 4px" }}></div>
                          </div>
                        </div>
                        <textarea
                          id="editor-content-textarea"
                          name="content"
                          value={formValues.content}
                          onChange={handleChange}
                          className={`${styles.editorInput} ${styles.editorTextarea} ${styles.editorTextareaLarge}`}
                          placeholder="Write the full article here. Separate paragraphs with a blank line."
                        />
                        <span className={styles.editorHint}>{wordCount} words in this post</span>
                      </div>

                      <div className={styles.editorTwoColumn}>
                        <label className={styles.editorField}>
                          <span className={styles.editorLabel}>Format</span>
                          <select
                            name="format"
                            value={formValues.format}
                            onChange={handleChange}
                            className={styles.editorSelect}
                          >
                            <option value="image">Image Post</option>
                            <option value="video">Video Post</option>
                            <option value="audio">Audio Post</option>
                            <option value="gallery">Gallery Post</option>
                          </select>
                        </label>
                        <label className={styles.editorField}>
                          <span className={styles.editorLabel}>Tags</span>
                          <input
                            name="tags"
                            value={formValues.tags}
                            onChange={handleChange}
                            className={styles.editorInput}
                            placeholder="minimalism, calm, focus"
                            autoComplete="off"
                          />
                        </label>
                      </div>

                      {formValues.format === "video" && (
                        <>
                          <label className={styles.editorField}>
                            <span className={styles.editorLabel}>Video Embed URL</span>
                            <input
                              name="videoUrl"
                              value={formValues.videoUrl}
                              onChange={handleChange}
                              className={styles.editorInput}
                              placeholder="https://player.vimeo.com/video/76979871"
                              autoComplete="off"
                            />
                            <span className={styles.editorHint}>
                              You can paste a YouTube or Vimeo link, or upload a direct video file below.
                            </span>
                          </label>

                          <div className={styles.editorUploadCard}>
                            <div className={styles.editorUploadHeader}>
                              <div>
                                <h3 className={styles.editorUploadTitle}>Upload Video</h3>
                                <p className={styles.editorUploadText}>
                                  MP4, WebM, or OGG files will be stored with this post automatically.
                                </p>
                              </div>
                              <label className={styles.editorUploadButton}>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleVideoFileChange}
                                  className={styles.editorFileInput}
                                />
                                <i className="fas fa-film"></i>
                                <span>{videoFile ? "Replace video" : "Upload video"}</span>
                              </label>
                            </div>
                            <span className={styles.editorHint}>
                              {videoFile ? videoFile.name : "No video file selected yet."}
                            </span>
                          </div>
                        </>
                      )}

                      {formValues.format === "audio" && (
                        <>
                          <label className={styles.editorField}>
                            <span className={styles.editorLabel}>Audio URL</span>
                            <input
                              name="audioUrl"
                              value={formValues.audioUrl}
                              onChange={handleChange}
                              className={styles.editorInput}
                              placeholder="https://example.com/audio.mp3"
                              autoComplete="off"
                            />
                            <span className={styles.editorHint}>
                              You can paste an audio URL/embed link, or upload an audio file below.
                            </span>
                          </label>

                          <div className={styles.editorUploadCard}>
                            <div className={styles.editorUploadHeader}>
                              <div>
                                <h3 className={styles.editorUploadTitle}>Upload Audio</h3>
                                <p className={styles.editorUploadText}>
                                  MP3, WAV, OGG, or M4A files can be attached directly to this post.
                                </p>
                              </div>
                              <label className={styles.editorUploadButton}>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={handleAudioFileChange}
                                  className={styles.editorFileInput}
                                />
                                <i className="fas fa-music"></i>
                                <span>{audioFile ? "Replace audio" : "Upload audio"}</span>
                              </label>
                            </div>
                            <span className={styles.editorHint}>
                              {audioFile ? audioFile.name : "No audio file selected yet."}
                            </span>
                          </div>
                        </>
                      )}

                      {(formValues.format === "gallery" || formValues.format === "image") && (
                        <div className={styles.editorUploadCard} style={{ display: "block" }}>
                          <div className={styles.editorUploadHeader} style={{ marginBottom: "15px" }}>
                            <div>
                              <h3 className={styles.editorUploadTitle}>Gallery Images & Captions</h3>
                              <p className={styles.editorUploadText}>
                                Add multiple images and enter text to display underneath each image.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddGalleryItem}
                              className={styles.toolbarButtonPrimary}
                              style={{ padding: "8px 16px", fontSize: "14px" }}
                            >
                              <i className="fas fa-plus"></i>
                              <span>Add Image Block</span>
                            </button>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {galleryItems.map((item, index) => {
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    border: "1px solid var(--dashboard-border)",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    background: "rgba(0,0,0,0.02)",
                                    position: "relative",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryItem(item.id)}
                                    style={{
                                      position: "absolute",
                                      top: "12px",
                                      right: "12px",
                                      background: "none",
                                      border: "none",
                                      color: "#ff4d4d",
                                      cursor: "pointer",
                                      fontSize: "16px",
                                    }}
                                    title="Delete block"
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>

                                  <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "600" }}>
                                    Image Block #{index + 1}
                                  </h4>

                                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "16px" }}>
                                    <div
                                      style={{
                                        width: "150px",
                                        height: "100px",
                                        borderRadius: "6px",
                                        overflow: "hidden",
                                        background: "var(--dashboard-bg-surface)",
                                        border: "1px dashed var(--dashboard-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                      }}
                                    >
                                      {item.previewUrl ? (
                                        <Image
                                          src={item.previewUrl}
                                          alt="Preview"
                                          fill
                                          unoptimized
                                          style={{ objectFit: "cover" }}
                                        />
                                      ) : (
                                        <i className="far fa-images" style={{ fontSize: "24px", color: "var(--dashboard-text-muted)" }}></i>
                                      )}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        <input
                                          type="text"
                                          value={item.imageUrl}
                                          onChange={(e) => handleGalleryItemChange(item.id, "imageUrl", e.target.value)}
                                          className={styles.editorInput}
                                          placeholder="Image URL (e.g. /images/...) or upload a file"
                                          style={{ flex: 1 }}
                                        />
                                        <label
                                          style={{
                                            padding: "8px 12px",
                                            background: "var(--dashboard-bg-surface)",
                                            border: "1px solid var(--dashboard-border)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleGalleryItemFileChange(item.id, e)}
                                            style={{ display: "none" }}
                                          />
                                          <i className="fas fa-upload"></i>
                                          <span>Upload</span>
                                        </label>
                                      </div>

                                      <textarea
                                        value={item.text}
                                        onChange={(e) => handleGalleryItemChange(item.id, "text", e.target.value)}
                                        className={styles.editorInput}
                                        placeholder="Write caption or text below this image..."
                                        style={{ height: "60px", resize: "none" }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {galleryItems.length === 0 && (
                              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--dashboard-text-muted)", border: "1px dashed var(--dashboard-border)", borderRadius: "8px" }}>
                                No images in the gallery yet. Click "Add Image Block" above to add.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <label className={styles.editorField}>
                        <span className={styles.editorLabel}>Featured Image URL</span>
                        <input
                          name="imageUrl"
                          value={formValues.imageUrl}
                          onChange={handleChange}
                          className={styles.editorInput}
                          placeholder="/images/bench-accounting-h51-unsplash.jpg"
                          autoComplete="off"
                        />
                      </label>

                      <div className={styles.editorUploadCard}>
                        <div className={styles.editorUploadHeader}>
                          <div>
                            <h3 className={styles.editorUploadTitle}>Featured Media</h3>
                            <p className={styles.editorUploadText}>
                              Upload a fresh image or keep using the image URL above.
                            </p>
                          </div>
                          <label className={styles.editorUploadButton}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className={styles.editorFileInput}
                            />
                            <i className="fas fa-upload"></i>
                            <span>{featuredImageFile ? "Replace image" : "Upload image"}</span>
                          </label>
                        </div>

                        <div className={styles.editorPreviewSurface}>
                          {formValues.format === "video" && videoPreview ? (
                            isDirectVideoFile(videoPreview) ? (
                              <video controls preload="metadata" className={styles.editorMediaFrame}>
                                <source src={videoPreview} />
                              </video>
                            ) : (
                              <iframe
                                src={getVideoEmbedSource(videoPreview)}
                                title="Video preview"
                                className={styles.editorVideoFrame}
                                allow="autoplay; fullscreen; picture-in-picture"
                              ></iframe>
                            )
                          ) : formValues.format === "audio" && audioPreview ? (
                            isDirectAudioFile(audioPreview) ? (
                              <div className={styles.editorAudioSurface}>
                                {imagePreview ? (
                                  <Image
                                    src={imagePreview}
                                    alt={formValues.title || "Audio cover preview"}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 991px) 100vw, 50vw"
                                    className={styles.editorPreviewImage}
                                  />
                                ) : null}
                                <div className={styles.editorAudioOverlay}>
                                  <audio controls preload="metadata" className={styles.editorAudioPlayer}>
                                    <source src={audioPreview} />
                                  </audio>
                                </div>
                              </div>
                            ) : (
                              <iframe
                                src={audioPreview}
                                title="Audio preview"
                                className={styles.editorVideoFrame}
                                allow="autoplay"
                              ></iframe>
                            )
                          ) : imagePreview ? (
                            <div className={styles.editorPreviewImageWrap}>
                              <Image
                                src={imagePreview}
                                alt={formValues.title || "Featured media preview"}
                                fill
                                unoptimized
                                sizes="(max-width: 991px) 100vw, 50vw"
                                className={styles.editorPreviewImage}
                              />
                            </div>
                          ) : (
                            <div className={styles.editorPreviewEmpty}>
                              <i className="far fa-image"></i>
                              <span>Featured image preview will appear here.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className={styles.editorSidebarStack}>
                    <aside className={`${styles.panel} ${styles.editorSidebarPanel}`}>
                      <div className={styles.postsPanelHeader}>
                        <div>
                          <h2 className={styles.panelTitle}>Publish</h2>
                          <p className={styles.postsPanelMeta}>
                            Set visibility and publishing details.
                          </p>
                        </div>
                      </div>

                      <div className={styles.editorSidebarFields}>
                        <label className={styles.editorField}>
                          <span className={styles.editorLabel}>Status</span>
                          <select
                            name="status"
                            value={formValues.status}
                            onChange={handleChange}
                            className={styles.editorSelect}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </label>

                        <div className={styles.editorChecklist}>
                          <label className={styles.editorToggleRow}>
                            <span>
                              <strong>Featured post</strong>
                              <small>Show this in the hero rotation.</small>
                            </span>
                            <input
                              type="checkbox"
                              name="isFeatured"
                              checked={formValues.isFeatured}
                              onChange={handleChange}
                            />
                          </label>

                          <label className={styles.editorToggleRow}>
                            <span>
                              <strong>Sticky recent post</strong>
                              <small>Keep this highlighted in the recent list.</small>
                            </span>
                            <input
                              type="checkbox"
                              name="isSticky"
                              checked={formValues.isSticky}
                              onChange={handleChange}
                            />
                          </label>
                        </div>

                        <div className={styles.editorMetaList}>
                          <div className={styles.editorMetaRow}>
                            <span>Author</span>
                            <strong>{initialPost?.author ?? "Admin"}</strong>
                          </div>
                          <div className={styles.editorMetaRow}>
                            <span>Published</span>
                            <strong>{formatDateTimeLabel(initialPost?.publishedAt)}</strong>
                          </div>
                          <div className={styles.editorMetaRow}>
                            <span>Views</span>
                            <strong>{initialPost?.totalViews ?? 0}</strong>
                          </div>
                          <div className={styles.editorMetaRow}>
                            <span>Comments</span>
                            <strong>{initialPost?.comments ?? 0}</strong>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className={styles.saveButton}
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? "Saving..."
                            : editorMode === "edit"
                              ? "Update Post"
                              : formValues.status === "published"
                                ? "Publish Now"
                                : "Save Draft"}
                        </button>
                      </div>
                    </aside>

                    <aside className={`${styles.panel} ${styles.editorSidebarPanel}`}>
                      <div className={styles.postsPanelHeader}>
                        <div>
                          <h2 className={styles.panelTitle}>At A Glance</h2>
                          <p className={styles.postsPanelMeta}>
                            Quick summary before you publish.
                          </p>
                        </div>
                      </div>

                      <div className={styles.editorMetaList}>
                        <div className={styles.editorMetaRow}>
                          <span>Current mode</span>
                          <strong>{editorMode === "edit" ? "Editing live record" : "Creating new record"}</strong>
                        </div>
                        <div className={styles.editorMetaRow}>
                          <span>Slug preview</span>
                          <strong>{formValues.slug || "auto-generated"}</strong>
                        </div>
                        <div className={styles.editorMetaRow}>
                          <span>Category</span>
                          <strong>{formValues.category || "No category yet"}</strong>
                        </div>
                        <div className={styles.editorMetaRow}>
                          <span>Media type</span>
                          <strong>{formValues.format}</strong>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
