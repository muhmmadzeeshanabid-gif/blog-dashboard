"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import Sidebar from "../../Sidebar";
import { useAuth } from "../../../../lib/authContext";
import { isSupabaseConfigured, supabase } from "../../../../lib/supabase";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownInlineToHtml(value) {
  let html = escapeHtml(value);

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  html = html.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  return html;
}

function markdownToEditorHtml(value) {
  const content = String(value ?? "").trim();

  if (!content) {
    return "";
  }

  return content
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const trimmedBlock = block.trim();

      if (/^-{3,}$/.test(trimmedBlock)) {
        return "<hr>";
      }

      const headingMatch = trimmedBlock.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = Math.min(6, headingMatch[1].length);
        return `<h${level}>${markdownInlineToHtml(headingMatch[2])}</h${level}>`;
      }

      if (lines.length > 0 && lines.every((line) => /^-\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => `<li>${markdownInlineToHtml(line.replace(/^-\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }

      if (lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line))) {
        return `<ol>${lines
          .map((line) => `<li>${markdownInlineToHtml(line.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }

      if (lines.length > 0 && lines.every((line) => /^>\s?/.test(line))) {
        const quote = lines.map((line) => line.replace(/^>\s?/, "")).join("<br>");
        return `<blockquote>${markdownInlineToHtml(quote)}</blockquote>`;
      }

      return `<p>${markdownInlineToHtml(trimmedBlock).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

function normalizeEditorText(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+\n/g, "\n").trim();
}

function cleanInlineEditorText(value) {
  return String(value ?? "").replace(/\u00a0/g, " ");
}

function nodeInlineToMarkdown(node) {
  if (!node) return "";

  if (node.nodeType === Node.TEXT_NODE) {
    return cleanInlineEditorText(node.textContent);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tagName = node.tagName.toLowerCase();
  const content = Array.from(node.childNodes).map(nodeInlineToMarkdown).join("");

  if (tagName === "br") return "\n";
  if (tagName === "strong" || tagName === "b") return `**${content}**`;
  if (tagName === "em" || tagName === "i") return `*${content}*`;
  if (tagName === "u") return `<u>${content}</u>`;
  if (tagName === "del" || tagName === "s" || tagName === "strike") return `~~${content}~~`;
  if (tagName === "a") {
    const href = node.getAttribute("href") || "https://example.com";
    return `[${content || href}](${href})`;
  }

  return content;
}

function blockNodeToMarkdown(node, index = 0) {
  if (!node) return "";

  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeEditorText(node.textContent);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tagName = node.tagName.toLowerCase();

  if (tagName === "hr") return "---";
  if (/^h[1-6]$/.test(tagName)) {
    return `${"#".repeat(Number(tagName.slice(1)))} ${nodeInlineToMarkdown(node)}`.trim();
  }
  if (tagName === "blockquote") {
    return nodeInlineToMarkdown(node)
      .split("\n")
      .map((line) => `> ${line}`.trimEnd())
      .join("\n");
  }
  if (tagName === "ul") {
    return Array.from(node.children)
      .filter((child) => child.tagName?.toLowerCase() === "li")
      .map((child) => `- ${nodeInlineToMarkdown(child)}`.trimEnd())
      .join("\n");
  }
  if (tagName === "ol") {
    return Array.from(node.children)
      .filter((child) => child.tagName?.toLowerCase() === "li")
      .map((child, itemIndex) => `${itemIndex + 1}. ${nodeInlineToMarkdown(child)}`.trimEnd())
      .join("\n");
  }
  if (tagName === "li") {
    return `${index + 1}. ${nodeInlineToMarkdown(node)}`.trimEnd();
  }

  return nodeInlineToMarkdown(node);
}

function editorElementToMarkdown(editor) {
  if (!editor) return "";

  return Array.from(editor.childNodes)
    .map(blockNodeToMarkdown)
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n");
}

function compressImageFile(file, maxWidth = 1400, maxHeight = 1400, quality = 0.80) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function requestSignedUpload(file, slug, mediaKind) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug: slug || "post",
      mediaKind: mediaKind || "image",
      fileName: file?.name || "",
      fileSize: file?.size || 0,
      contentType: file?.type || "application/octet-stream",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Upload failed (${response.status}).`);
  }

  return data;
}

// Files now go from the browser straight to Supabase Storage using signed uploads.
async function uploadFileToSupabase(file, slug, mediaKind) {
  if (!file) return null;

  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured for uploads.");
  }

  const uploadConfig = await requestSignedUpload(file, slug, mediaKind);
  const { error } = await supabase.storage
    .from("blog-media")
    .uploadToSignedUrl(uploadConfig.path, uploadConfig.token, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Upload failed.");
  }

  return uploadConfig.url || null;
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsList, setNotificationsList] = useState(() => initialNotifications ?? []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef(null);
  const contentEditorRef = useRef(null);

  const [editorMode, setEditorMode] = useState(mode);
  const [activeSlug, setActiveSlug] = useState(initialPost?.slug ?? "");
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [formValues, setFormValues] = useState(() => buildInitialValues(initialPost));
  const [featuredImageMode, setFeaturedImageMode] = useState(() => (initialPost?.image ? "url" : "upload"));
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

  const notifications = notificationsList.map((item) => ({
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
    // Sync theme with cookie on mount to handle client-side navigations
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
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    const onDocumentMouseDown = (event) => {
      if (
        event.target instanceof Element &&
        !event.target.closest("[data-dashboard-notifications]")
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

  useEffect(() => {
    const editor = contentEditorRef.current;
    if (!editor || document.activeElement === editor) {
      return;
    }

    const nextHtml = markdownToEditorHtml(formValues.content);
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [formValues.content]);

  const handleThemeToggle = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.body.classList.toggle("bwp-dark-style", nextValue);
    setThemeCookie(nextValue);
  };

  const syncContentEditor = () => {
    const nextContent = editorElementToMarkdown(contentEditorRef.current);
    setSubmitError("");
    setSubmitSuccess("");
    setFormValues((prev) => (prev.content === nextContent ? prev : { ...prev, content: nextContent }));
  };

  const handleFormatText = (type) => {
    const editor = contentEditorRef.current;
    if (!editor) return;

    editor.focus();

    switch (type) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "underline":
        document.execCommand("underline");
        break;
      case "strike":
        document.execCommand("strikeThrough");
        break;
      case "hr":
        document.execCommand("insertHorizontalRule");
        break;
      case "title":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "quote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "bullet":
        document.execCommand("insertUnorderedList");
        break;
      case "numbered":
        document.execCommand("insertOrderedList");
        break;
      case "link": {
        const url = window.prompt("Enter link URL", "https://example.com");
        if (url) {
          document.execCommand("createLink", false, url);
        }
        break;
      }
      default:
        return;
    }

    syncContentEditor();
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

  const handleFeaturedImageModeChange = (event) => {
    const nextMode = event.target.value;
    setFeaturedImageMode(nextMode);
    setSubmitError("");
    setSubmitSuccess("");

    if (nextMode === "url") {
      setFeaturedImageFile(null);
    }
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
      if (next) {
        setIsNotificationsOpen(false);
      }
      return next;
    });
    setSearchQuery("");
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
      // 1. Upload media directly from the browser to Supabase Storage.
      //    The app route only signs each upload, so large files do not proxy through the server.
      //    Images are compressed before upload to keep them lighter.
      const postSlug =
        formValues.slug ||
        formValues.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60) ||
        "post";

      let uploadedImageUrl = null;
      if (featuredImageFile) {
        const compressed = await compressImageFile(featuredImageFile);
        uploadedImageUrl = await uploadFileToSupabase(compressed, postSlug, "image");
      }

      let uploadedVideoUrl = null;
      if (videoFile && formValues.format === "video") {
        uploadedVideoUrl = await uploadFileToSupabase(videoFile, postSlug, "video");
      }

      let uploadedAudioUrl = null;
      if (audioFile && formValues.format === "audio") {
        uploadedAudioUrl = await uploadFileToSupabase(audioFile, postSlug, "audio");
      }

      // Upload gallery images directly too
      const resolvedGalleryItems = await Promise.all(
        galleryItems.map(async (item) => {
          if (item.file) {
            const compressed = await compressImageFile(item.file);
            const url = await uploadFileToSupabase(compressed, `${postSlug}-gal`, "image");
            return { ...item, imageUrl: url || item.imageUrl, file: null, hasFile: false };
          }
          return item;
        })
      );

      // 2. Build a plain JSON payload (no files — just text + URLs)
      const payload = new FormData();
      payload.set("title", formValues.title);
      payload.set("slug", formValues.slug);
      payload.set("category", formValues.category);
      payload.set("excerpt", formValues.excerpt);
      payload.set("content", formValues.content);
      // Pass uploaded Supabase URL if available, otherwise fall back to typed URL
      payload.set("imageUrl", uploadedImageUrl || formValues.imageUrl);
      payload.set("videoUrl", uploadedVideoUrl || formValues.videoUrl);
      payload.set("audioUrl", uploadedAudioUrl || formValues.audioUrl);
      payload.set("tags", formValues.tags);
      payload.set("format", formValues.format);
      payload.set("status", formValues.status);
      payload.set("isFeatured", String(formValues.isFeatured));
      payload.set("isSticky", String(formValues.isSticky));

      // Serialize gallery — all files already uploaded, just send URLs
      const serializedGallery = resolvedGalleryItems.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        text: item.text,
        hasFile: false,
      }));
      payload.set("galleryItems", JSON.stringify(serializedGallery));
      // No file blobs in payload — all already in Supabase

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

      // Update galleryItems local state with saved URLs
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
      if (result.notification) {
        setNotificationsList((current) => [
          result.notification,
          ...current.filter((item) => item.id !== result.notification.id),
        ].slice(0, 6));
      }
      setSubmitSuccess(result.message);
    } catch (err) {
      console.error("Save error:", err);
      setSubmitError(err?.message || "Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentToolbarItems = [
    { type: "bold", label: "B", title: "Bold", className: styles.editorToolbarBold },
    { type: "italic", label: "I", title: "Italic", className: styles.editorToolbarItalic },
    { type: "underline", label: "U", title: "Underline", className: styles.editorToolbarUnderline },
    { type: "strike", label: "S", title: "Strikethrough", className: styles.editorToolbarStrike },
    { type: "title", label: "H2", title: "Heading" },
    { type: "quote", label: "Quote", title: "Quote" },
    { type: "bullet", label: "List", title: "Bullet list" },
    { type: "numbered", label: "1.", title: "Numbered list" },
    { type: "link", label: "Link", title: "Link" },
    { type: "hr", label: "HR", title: "Horizontal rule" },
  ];

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
                <button
                  type="button"
                  className={`${styles.iconButton} ${isSearchOpen ? styles.iconButtonActive : ""}`}
                  aria-label="Search posts"
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>
                <div className={styles.topOverlay} ref={profileRef} data-dashboard-profile="true">
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
                    placeholder="Search posts..."
                    aria-label="Search posts"
                  />
                </div>
              </div>
            )}

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
                        <div className={styles.editorContentHeader}>
                          <span className={styles.editorLabel}>Content</span>
                          <div className={styles.editorToolbar} aria-label="Content formatting toolbar">
                            {contentToolbarItems.map((item) => (
                              <button
                                key={item.type}
                                type="button"
                                className={`${styles.editorToolbarButton} ${item.className || ""}`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleFormatText(item.type)}
                                title={item.title}
                                aria-label={item.title}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div
                          id="editor-content-editor"
                          ref={contentEditorRef}
                          className={`${styles.editorInput} ${styles.editorTextarea} ${styles.editorTextareaLarge} ${styles.editorRichTextarea}`}
                          contentEditable
                          role="textbox"
                          aria-multiline="true"
                          data-placeholder="Write the full article here. Select text and choose an option above."
                          suppressContentEditableWarning
                          onInput={syncContentEditor}
                          onBlur={syncContentEditor}
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
                        <span className={styles.editorLabel}>Featured Image Source</span>
                        <select
                          value={featuredImageMode}
                          onChange={handleFeaturedImageModeChange}
                          className={styles.editorSelect}
                        >
                          <option value="upload">Upload image</option>
                          <option value="url">Image URL</option>
                        </select>
                      </label>

                      {featuredImageMode === "url" ? (
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
                      ) : null}

                      <div className={styles.editorUploadCard}>
                        <div className={styles.editorUploadHeader}>
                          <div>
                            <h3 className={styles.editorUploadTitle}>Featured Media</h3>
                            <p className={styles.editorUploadText}>
                              {featuredImageMode === "upload"
                                ? "Upload a fresh image from your device."
                                : "Using the image URL selected above."}
                            </p>
                          </div>
                          {featuredImageMode === "upload" ? (
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
                          ) : null}
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
