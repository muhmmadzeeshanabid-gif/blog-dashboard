"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import Sidebar from "../../Sidebar";
import { DashboardCreatableSelect, DashboardSelect } from "../../DashboardSelect";
import { useAuth } from "../../../../lib/authContext";
import { useNotifications } from "../../../../lib/notificationsContext";
import { useDashboardSettings } from "../../layout";
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
  const sUrl = String(url ?? "");
  if (sUrl.startsWith("blob:")) return true;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(sUrl);
}

function isDirectAudioFile(url) {
  const sUrl = String(url ?? "");
  if (sUrl.startsWith("blob:")) return true;
  return /\.(mp3|wav|ogg|m4a|weba|webm|aac|flac)(\?.*)?$/i.test(sUrl);
}

function getAudioEmbedSource(url) {
  const rawUrl = String(url ?? "").trim();

  if (!rawUrl || isDirectAudioFile(rawUrl)) {
    return rawUrl;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    const isSoundCloudWidget =
      parsedUrl.hostname.includes("w.soundcloud.com") && parsedUrl.pathname.includes("/player");
    const isSoundCloudTrack =
      parsedUrl.hostname.includes("soundcloud.com") && !parsedUrl.hostname.includes("w.soundcloud.com");

    if (isSoundCloudWidget) {
      parsedUrl.searchParams.set("visual", "true");
      parsedUrl.searchParams.set("show_comments", "false");
      parsedUrl.searchParams.set("show_artwork", "true");
      parsedUrl.searchParams.set("maxheight", "1000");
      parsedUrl.searchParams.set("maxwidth", "1000");
      return parsedUrl.toString();
    }

    if (isSoundCloudTrack) {
      const widgetUrl = new URL("https://w.soundcloud.com/player/");
      widgetUrl.searchParams.set("visual", "true");
      widgetUrl.searchParams.set("show_comments", "false");
      widgetUrl.searchParams.set("url", rawUrl);
      widgetUrl.searchParams.set("show_artwork", "true");
      widgetUrl.searchParams.set("maxheight", "1000");
      widgetUrl.searchParams.set("maxwidth", "1000");
      return widgetUrl.toString();
    }
  } catch {
    return rawUrl;
  }

  return rawUrl;
}

function isTallAudioEmbed(url) {
  const embedSource = getAudioEmbedSource(url);
  return embedSource.includes("w.soundcloud.com/player") && embedSource.includes("visual=true");
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
    seoTitle: initialPost?.seoTitle ?? "",
    seoDescription: initialPost?.seoDescription ?? "",
    ogImage: initialPost?.ogImage ?? "",
  };
}

function findSelectOption(options, value) {
  return options.find((option) => option.value === value) || null;
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
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
    refresh: refreshNotificationsState,
  } = useNotifications();
  const router = useRouter();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const { showSidebar: dbShowSidebar, sidebarPosition: dbSidebarPosition } = useDashboardSettings();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!dbShowSidebar);

  useEffect(() => {
    setIsSidebarCollapsed(!dbShowSidebar);
  }, [dbShowSidebar]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const [videoSourceMode, setVideoSourceMode] = useState(() => {
    if (initialPost?.videoUrl) {
      const url = initialPost.videoUrl;
      if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) {
        return "url";
      }
      if (url.includes("supabase") || url.includes("blog-media")) {
        return "upload";
      }
      return "url";
    }
    return "upload";
  });
  const [audioSourceMode, setAudioSourceMode] = useState(() => {
    if (initialPost?.audioUrl) {
      const url = initialPost.audioUrl;
      if (url.includes("supabase") || url.includes("blog-media")) {
        return "upload";
      }
      return "url";
    }
    return "upload";
  });
  const [hasManualSlug, setHasManualSlug] = useState(Boolean(initialPost?.slug));
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [lastSavedLabel, setLastSavedLabel] = useState(
    initialPost?.updatedAt ? formatDateTimeLabel(initialPost.updatedAt) : initialLastUpdatedLabel
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExcerptHelp, setShowExcerptHelp] = useState(false);
  const [seoPreviewTab, setSeoPreviewTab] = useState("google");
  const [ogImageFile, setOgImageFile] = useState(null);
  const ogImageInputRef = useRef(null);
  const [focusKeyword, setFocusKeyword] = useState("authentication");
  const [seoTab, setSeoTab] = useState("seo");
  const [advancedRobots, setAdvancedRobots] = useState("index");
  const [advancedCanonical, setAdvancedCanonical] = useState("");

  const uploadedOgPreview = useMemo(
    () => (ogImageFile ? URL.createObjectURL(ogImageFile) : ""),
    [ogImageFile]
  );

  useEffect(() => {
    return () => {
      if (uploadedOgPreview) {
        URL.revokeObjectURL(uploadedOgPreview);
      }
    };
  }, [uploadedOgPreview]);

  const handleOgFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setOgImageFile(nextFile);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleOgFileDelete = () => {
    setOgImageFile(null);
    setFormValues((current) => ({
      ...current,
      ogImage: "",
    }));
  };

  const seoScore = useMemo(() => {
    let score = 0;
    const titleVal = formValues.seoTitle || formValues.title || "";
    const descVal = formValues.seoDescription || formValues.excerpt || "";
    const slugVal = formValues.slug || "";
    const keyword = focusKeyword.trim().toLowerCase();

    // 1. Title length check (max 25)
    if (titleVal.length >= 40 && titleVal.length <= 60) {
      score += 25;
    } else if (titleVal.length > 0) {
      score += 10;
    }

    // 2. Meta description length check (max 25)
    if (descVal.length >= 120 && descVal.length <= 160) {
      score += 25;
    } else if (descVal.length > 0) {
      score += 10;
    }

    if (keyword) {
      // 3. Focus keyword present (max 10)
      score += 10;

      // 4. Focus keyword in Title (max 15)
      if (titleVal.toLowerCase().includes(keyword)) {
        score += 15;
      }

      // 5. Focus keyword in Description (max 15)
      if (descVal.toLowerCase().includes(keyword)) {
        score += 15;
      }

      // 6. Focus keyword in Slug (max 10)
      if (slugVal.toLowerCase().includes(keyword.replace(/\s+/g, "-"))) {
        score += 10;
      }
    }

    return score;
  }, [formValues.seoTitle, formValues.title, formValues.seoDescription, formValues.excerpt, formValues.slug, focusKeyword]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryInputValue, setCategoryInputValue] = useState("");

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

  const [extraImages, setExtraImages] = useState(() => {
    if (initialPost && Array.isArray(initialPost.extraImages) && initialPost.extraImages.length > 0) {
      return initialPost.extraImages.map((item, idx) => ({
        id: `extra-${idx}-${Date.now()}`,
        imageUrl: item.image || "",
        text: item.text || "",
        hasFile: false,
        file: null,
        previewUrl: item.image || "",
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

  const handleAddExtraImage = () => {
    setExtraImages((current) => [
      ...current,
      {
        id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: "",
        text: "",
        hasFile: false,
        file: null,
        previewUrl: "",
      },
    ]);
  };

  const handleRemoveExtraImage = (id) => {
    setExtraImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target && target.previewUrl && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleExtraImageChange = (id, field, value) => {
    setExtraImages((current) =>
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

  const handleExtraImageFileChange = (id, event) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setExtraImages((current) =>
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

  const handleResetEditor = (force = false) => {
    if (!force && !submitSuccess) {
      const confirmReset = window.confirm("Are you sure you want to reset the editor? Any unsaved changes will be lost.");
      if (!confirmReset) return;
    }

    // Revoke any gallery item blob URLs to avoid memory leaks
    galleryItems.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    extraImages.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setEditorMode("create");
    setActiveSlug("");
    setHasManualSlug(false);
    setSubmitError("");
    setSubmitSuccess("");
    setLastSavedLabel("Not published yet");
    setFormValues({
      title: "",
      slug: "",
      category: "Minimalism",
      excerpt: "",
      content: "",
      imageUrl: "",
      videoUrl: "",
      audioUrl: "",
      tags: "",
      format: "image",
      status: "draft",
      isFeatured: false,
      isSticky: false,
      seoTitle: "",
      seoDescription: "",
      ogImage: "",
    });
    setGalleryItems([]);
    setExtraImages([]);
    setFeaturedImageFile(null);
    setFeaturedImageMode("upload");
    setVideoFile(null);
    setAudioFile(null);
    setVideoSourceMode("upload");
    setAudioSourceMode("upload");

    if (contentEditorRef.current) {
      contentEditorRef.current.innerHTML = "";
    }
  };

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

  const categorySelectOptions = useMemo(
    () => categoryOptions.map((category) => ({ value: category, label: category })),
    [categoryOptions]
  );

  const categorySelectValue = useMemo(() => {
    const currentCategory = formValues.category.trim();
    if (!currentCategory) return null;
    return findSelectOption(categorySelectOptions, currentCategory) || {
      value: currentCategory,
      label: currentCategory,
    };
  }, [categorySelectOptions, formValues.category]);

  const formatSelectOptions = [
    { value: "image", label: "Image Post" },
    { value: "video", label: "Video Post" },
    { value: "audio", label: "Audio Post" },
    { value: "gallery", label: "Carousel (Gallery) Post" },
  ];

  const videoSourceOptions = [
    { value: "upload", label: "Upload Video File" },
    { value: "url", label: "Video URL / Embed Link" },
  ];

  const audioSourceOptions = [
    { value: "upload", label: "Upload Audio File" },
    { value: "url", label: "Audio URL / Embed Link" },
  ];

  const featuredImageSourceOptions = [
    { value: "upload", label: "Upload image" },
    { value: "url", label: "Image URL" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ];

  const robotsOptions = [
    { value: "index", label: "Index (Allow search engines to show this post)" },
    { value: "noindex", label: "Noindex (Hide this post from search engines)" },
  ];

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

      let uploadedOgImageUrl = null;
      if (ogImageFile) {
        const compressed = await compressImageFile(ogImageFile);
        uploadedOgImageUrl = await uploadFileToSupabase(compressed, `${postSlug}-og`, "image");
      }

      let uploadedVideoUrl = null;
      if (videoFile && formValues.format === "video" && videoSourceMode === "upload") {
        uploadedVideoUrl = await uploadFileToSupabase(videoFile, postSlug, "video");
      }

      let uploadedAudioUrl = null;
      if (audioFile && formValues.format === "audio" && audioSourceMode === "upload") {
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

      // Upload extra images (additional images for gallery/carousel posts)
      const resolvedExtraImages = await Promise.all(
        extraImages.map(async (item) => {
          if (item.file) {
            const compressed = await compressImageFile(item.file);
            const url = await uploadFileToSupabase(compressed, `${postSlug}-extra`, "image");
            return { ...item, imageUrl: url || item.imageUrl, file: null, hasFile: false };
          }
          return item;
        })
      );

      let finalVideoUrl = "";
      if (formValues.format === "video") {
        if (videoSourceMode === "upload") {
          finalVideoUrl = uploadedVideoUrl || (isDirectVideoFile(formValues.videoUrl) ? formValues.videoUrl : "");
        } else {
          finalVideoUrl = formValues.videoUrl;
        }
      }

      let finalAudioUrl = "";
      if (formValues.format === "audio") {
        if (audioSourceMode === "upload") {
          finalAudioUrl = uploadedAudioUrl || (isDirectAudioFile(formValues.audioUrl) ? formValues.audioUrl : "");
        } else {
          finalAudioUrl = formValues.audioUrl;
        }
      }

      // 2. Build a plain JSON payload (no files — just text + URLs)
      const payload = new FormData();
      payload.set("title", formValues.title);
      payload.set("slug", formValues.slug);
      payload.set("category", formValues.category);
      payload.set("excerpt", formValues.excerpt);
      payload.set("content", formValues.content);
      // Pass uploaded Supabase URL if available, otherwise fall back to typed URL
      payload.set("imageUrl", uploadedImageUrl || formValues.imageUrl);
      payload.set("videoUrl", finalVideoUrl);
      payload.set("audioUrl", finalAudioUrl);
      payload.set("tags", formValues.tags);
      payload.set("format", formValues.format);
      payload.set("status", formValues.status);
      payload.set("isFeatured", String(formValues.isFeatured));
      payload.set("isSticky", String(formValues.isSticky));
      payload.set("seoTitle", formValues.seoTitle);
      payload.set("seoDescription", formValues.seoDescription);
      payload.set("ogImage", uploadedOgImageUrl || formValues.ogImage);

      // Serialize gallery — all files already uploaded, just send URLs
      const serializedGallery = resolvedGalleryItems.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        text: item.text,
        hasFile: false,
      }));
      payload.set("galleryItems", JSON.stringify(serializedGallery));

      // Serialize extra images
      const serializedExtraImages = resolvedExtraImages.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        text: item.text,
        hasFile: false,
      }));
      payload.set("extraImages", JSON.stringify(serializedExtraImages));
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
        seoTitle: nextPost.seoTitle ?? "",
        seoDescription: nextPost.seoDescription ?? "",
        ogImage: nextPost.ogImage ?? "",
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

      // Update extraImages local state with saved URLs
      if (Array.isArray(nextPost.extraImages)) {
        setExtraImages(
          nextPost.extraImages.map((item, idx) => ({
            id: `extra-${idx}-${Date.now()}`,
            imageUrl: item.image || "",
            text: item.text || "",
            hasFile: false,
            file: null,
            previewUrl: item.image || "",
          }))
        );
      } else {
        setExtraImages([]);
      }

      setFeaturedImageFile(null);
      setVideoFile(null);
      setAudioFile(null);

      if (nextPost.videoUrl) {
        if (nextPost.videoUrl.includes("youtube.com") || nextPost.videoUrl.includes("youtu.be") || nextPost.videoUrl.includes("vimeo.com")) {
          setVideoSourceMode("url");
        } else {
          setVideoSourceMode("upload");
        }
      } else {
        setVideoSourceMode("upload");
      }
      if (nextPost.audioUrl) {
        if (nextPost.audioUrl.includes("supabase") || nextPost.audioUrl.includes("blog-media")) {
          setAudioSourceMode("upload");
        } else {
          setAudioSourceMode("url");
        }
      } else {
        setAudioSourceMode("upload");
      }

      if (result.notification) {
        refreshNotificationsState();
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
            activeHref="/dashboard/posts"
            sidebarPosition={dbSidebarPosition}
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
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            className={styles.notificationAction}
                            onClick={handleMarkAllAsRead}
                          >
                            Mark all read
                          </button>
                          <span
                            style={{
                              color: "var(--dashboard-border-soft)",
                              fontSize: "12px",
                            }}
                          >
                            |
                          </span>
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
                    {submitSuccess && (
                      <button
                        type="button"
                        className={styles.toolbarButton}
                        onClick={() => handleResetEditor(true)}
                      >
                        <i className="fas fa-plus"></i>
                        <span>Write New Post</span>
                      </button>
                    )}
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
                      <button
                        type="button"
                        onClick={() => handleResetEditor(true)}
                        className={styles.editorAlertLink}
                        style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
                      >
                        Write a new post
                      </button>
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
                        <label className={styles.editorField} style={{ position: "relative" }}>
                          <span className={styles.editorLabel}>Category</span>
                          <DashboardCreatableSelect
                            inputId="post-category-select"
                            instanceId="post-category-select"
                            value={categorySelectValue}
                            options={categorySelectOptions}
                            inputValue={categoryInputValue}
                            placeholder="Type or pick a category..."
                            onInputChange={(nextValue, meta) => {
                              if (meta.action === "input-change") {
                                setCategoryInputValue(nextValue);
                              }
                            }}
                            onChange={(option) => {
                              const nextValue = option?.value || "";
                              setFormValues((prev) => ({ ...prev, category: nextValue }));
                              setCategoryInputValue("");
                            }}
                            onCreateOption={(inputValue) => {
                              const nextValue = inputValue.trim();
                              if (!nextValue) return;
                              setFormValues((prev) => ({ ...prev, category: nextValue }));
                              setCategoryInputValue("");
                            }}
                            onBlur={() => {
                              const nextValue = categoryInputValue.trim();
                              if (!nextValue) return;
                              setFormValues((prev) => ({ ...prev, category: nextValue }));
                              setCategoryInputValue("");
                            }}
                            minHeight={44}
                            borderRadius={14}
                            fontSize={12}
                          />
                          {/* Custom combobox — type freely OR pick from list */}
                          <div style={{ position: "relative", display: "none" }}>
                            <input
                              name="category"
                              value={formValues.category}
                              onChange={(e) => {
                                setCategorySearchQuery(e.target.value);
                                handleChange(e);
                                setCategoryDropdownOpen(true);
                              }}
                              onFocus={() => {
                                setCategorySearchQuery("");
                                setCategoryDropdownOpen(true);
                              }}
                              onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 160)}
                              className={styles.editorInput}
                              placeholder="Type or pick a category..."
                              autoComplete="off"
                              style={{ paddingRight: "36px" }}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setCategoryDropdownOpen((o) => !o)}
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--dashboard-text-muted)",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                transition: "transform 0.15s",
                              }}
                            >
                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>

                            {categoryDropdownOpen && (() => {
                              const q = categorySearchQuery.trim().toLowerCase();
                              const filtered = categoryOptions.filter((c) =>
                                !q || c.toLowerCase().includes(q)
                              );
                              // Show "Add custom" option when user typed something not in list
                              const showCustom = q && !categoryOptions.some(
                                (c) => c.toLowerCase() === q
                              ) && formValues.category.toLowerCase() !== q;

                              return (
                                <div
                                  className={styles.scrollbarHidden}
                                  style={{
                                  position: "absolute",
                                  top: "calc(100% + 4px)",
                                  left: 0,
                                  right: 0,
                                  background: "var(--dashboard-card-bg)",
                                  border: "1px solid var(--dashboard-card-border)",
                                  borderRadius: "10px",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                  zIndex: 200,
                                  maxHeight: "220px",
                                }}>
                                  {filtered.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setFormValues((prev) => ({ ...prev, category: cat }));
                                        setCategoryDropdownOpen(false);
                                        setCategorySearchQuery("");
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        width: "100%",
                                        padding: "9px 14px",
                                        background: formValues.category === cat ? "var(--dashboard-accent-soft, rgba(111,111,255,0.08))" : "transparent",
                                        border: "none",
                                        color: formValues.category === cat ? "var(--dashboard-accent)" : "var(--dashboard-text)",
                                        fontSize: "13px",
                                        fontWeight: formValues.category === cat ? 600 : 400,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "background 0.1s",
                                      }}
                                      onMouseEnter={(e) => { if (formValues.category !== cat) e.currentTarget.style.background = "var(--dashboard-card-hover, rgba(0,0,0,0.04))"; }}
                                      onMouseLeave={(e) => { if (formValues.category !== cat) e.currentTarget.style.background = "transparent"; }}
                                    >
                                      {formValues.category === cat && (
                                        <svg width="10" height="8" viewBox="0 0 9 7" fill="none" style={{ flexShrink: 0 }}>
                                          <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                      {cat}
                                    </button>
                                  ))}

                                  {showCustom && (
                                    <button
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const newCat = formValues.category.trim();
                                        if (newCat) {
                                          setFormValues((prev) => ({ ...prev, category: newCat }));
                                        }
                                        setCategoryDropdownOpen(false);
                                        setCategorySearchQuery("");
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        width: "100%",
                                        padding: "9px 14px",
                                        background: "transparent",
                                        border: "none",
                                        borderTop: "1px solid var(--dashboard-card-border)",
                                        color: "var(--dashboard-accent)",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--dashboard-accent-soft, rgba(111,111,255,0.08))"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <i className="fas fa-plus" style={{ fontSize: "10px" }}></i>
                                      Add &ldquo;{formValues.category}&rdquo; as new category
                                    </button>
                                  )}

                                  {filtered.length === 0 && !showCustom && (
                                    <div style={{ padding: "12px 14px", color: "var(--dashboard-text-muted)", fontSize: "13px" }}>
                                      No matching category. Keep typing to create a new one.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </label>
                      </div>

                      <div className={styles.editorField}>
                        <span className={styles.editorLabel} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Excerpt
                          <button
                            type="button"
                            onClick={() => setShowExcerptHelp(!showExcerptHelp)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--dashboard-text-muted)",
                              padding: "2px",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--dashboard-accent)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--dashboard-text-muted)"}
                            title="Preview excerpt placement example"
                          >
                            <i className={`far fa-${showExcerptHelp ? "eye" : "eye-slash"}`}></i>
                          </button>
                        </span>
                        <textarea
                          name="excerpt"
                          value={formValues.excerpt}
                          onChange={handleChange}
                          className={`${styles.editorInput} ${styles.editorTextarea} ${styles.editorTextareaCompact}`}
                          placeholder="Write a short summary that will appear on cards and listing pages."
                        />
                      </div>

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
                          <DashboardSelect
                            inputId="post-format-select"
                            value={findSelectOption(formatSelectOptions, formValues.format)}
                            onChange={(option) =>
                              setFormValues((prev) => ({ ...prev, format: option?.value || "image" }))
                            }
                            options={formatSelectOptions}
                            minHeight={44}
                            borderRadius={14}
                            fontSize={12}
                          />
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
                            <span className={styles.editorLabel}>Video Source Mode</span>
                            <DashboardSelect
                              inputId="post-video-source-select"
                              value={findSelectOption(videoSourceOptions, videoSourceMode)}
                              onChange={(option) => {
                                setVideoSourceMode(option?.value || "upload");
                                setSubmitError("");
                                setSubmitSuccess("");
                              }}
                              options={videoSourceOptions}
                              minHeight={44}
                              borderRadius={14}
                              fontSize={12}
                            />
                          </label>

                          {videoSourceMode === "url" ? (
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
                                  You can paste a YouTube or Vimeo link here.
                                </span>
                              </label>

                              {videoPreview && (
                                <div className={styles.editorPreviewSurface} style={{ marginTop: "15px" }}>
                                  {isDirectVideoFile(videoPreview) ? (
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
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
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
                                {videoFile ? videoFile.name : (formValues.videoUrl && isDirectVideoFile(formValues.videoUrl) ? "Previously uploaded video file is active." : "No video file selected yet.")}
                              </span>

                              {videoPreview && isDirectVideoFile(videoPreview) && (
                                <div className={styles.editorPreviewSurface} style={{ marginTop: "15px" }}>
                                  <video controls preload="metadata" className={styles.editorMediaFrame}>
                                    <source src={videoPreview} />
                                  </video>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {formValues.format === "audio" && (
                        <>
                          <label className={styles.editorField}>
                            <span className={styles.editorLabel}>Audio Source Mode</span>
                            <DashboardSelect
                              inputId="post-audio-source-select"
                              value={findSelectOption(audioSourceOptions, audioSourceMode)}
                              onChange={(option) => {
                                setAudioSourceMode(option?.value || "upload");
                                setSubmitError("");
                                setSubmitSuccess("");
                              }}
                              options={audioSourceOptions}
                              minHeight={44}
                              borderRadius={14}
                              fontSize={12}
                            />
                          </label>

                          {audioSourceMode === "url" ? (
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
                                  You can paste an audio URL or embed link here.
                                </span>
                              </label>

                              {audioPreview && (
                                <div className={styles.editorPreviewSurface} style={{ marginTop: "15px" }}>
                                  {isDirectAudioFile(audioPreview) ? (
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
                                      src={getAudioEmbedSource(audioPreview)}
                                      title="Audio preview"
                                      className={styles.editorVideoFrame}
                                      allow="autoplay"
                                      style={{ height: isTallAudioEmbed(audioPreview) ? "400px" : undefined }}
                                    ></iframe>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
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
                                {audioFile ? audioFile.name : (formValues.audioUrl && isDirectAudioFile(formValues.audioUrl) ? "Previously uploaded audio file is active." : "No audio file selected yet.")}
                              </span>

                              {audioPreview && isDirectAudioFile(audioPreview) && (
                                <div className={styles.editorPreviewSurface} style={{ marginTop: "15px" }}>
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
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {(formValues.format === "gallery" || formValues.format === "image" || formValues.format === "video" || formValues.format === "audio") && (
                        <div className={styles.editorUploadCard} style={{ display: "block" }}>
                          {/* Header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                            <div>
                              <h3 className={styles.editorUploadTitle}>
                                {formValues.format === "video" || formValues.format === "audio"
                                  ? "Additional Images & Captions"
                                  : "Gallery Images & Captions"}
                              </h3>
                              <p className={styles.editorUploadText}>
                                {formValues.format === "video" || formValues.format === "audio"
                                  ? "Add extra images to accompany your post along with the main media."
                                  : "Add multiple images and enter text to display underneath each image."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddGalleryItem}
                              className={styles.toolbarButtonPrimary}
                              style={{ padding: "8px 16px", fontSize: "14px", flexShrink: 0 }}
                            >
                              <i className="fas fa-plus"></i>
                              <span>Add Image Block</span>
                            </button>
                          </div>

                          {/* Empty state */}
                          {galleryItems.length === 0 && (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "32px 20px",
                                color: "var(--dashboard-text-muted)",
                                border: "1.5px dashed var(--dashboard-card-border)",
                                borderRadius: "10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <i className="far fa-images" style={{ fontSize: "28px", opacity: 0.4 }}></i>
                              <span style={{ fontSize: "13px" }}>No images yet. Click <strong>Add Image Block</strong> to start.</span>
                            </div>
                          )}

                          {/* Gallery items */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {galleryItems.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  border: "1px solid var(--dashboard-card-border)",
                                  borderRadius: "12px",
                                  padding: "14px",
                                  background: "var(--dashboard-card-hover, rgba(0,0,0,0.02))",
                                  position: "relative",
                                  display: "flex",
                                  gap: "14px",
                                  alignItems: "flex-start",
                                }}
                              >
                                {/* Image preview / drop zone */}
                                <label
                                  style={{
                                    width: "110px",
                                    height: "90px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    background: item.previewUrl ? "transparent" : "var(--dashboard-bg, #0f0f13)",
                                    border: item.previewUrl ? "none" : "1.5px dashed var(--dashboard-card-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "border-color 0.2s",
                                  }}
                                  title="Click to upload image"
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleGalleryItemFileChange(item.id, e)}
                                    style={{ display: "none" }}
                                  />
                                  {item.previewUrl ? (
                                    <>
                                      <Image
                                        src={item.previewUrl}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        style={{ objectFit: "cover" }}
                                      />
                                      {/* Replace overlay on hover */}
                                      <div style={{
                                        position: "absolute", inset: 0,
                                        background: "rgba(0,0,0,0.45)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        opacity: 0, transition: "opacity 0.2s",
                                        fontSize: "11px", color: "#fff", gap: "4px", flexDirection: "column",
                                      }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                      >
                                        <i className="fas fa-camera" style={{ fontSize: "16px" }}></i>
                                        Replace
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "var(--dashboard-text-muted)" }}>
                                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: "20px" }}></i>
                                      <span style={{ fontSize: "10px", fontWeight: 500 }}>Upload</span>
                                    </div>
                                  )}
                                </label>

                                {/* Right side: URL + caption */}
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
                                  {/* Block label + delete */}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--dashboard-text-soft)", letterSpacing: "0.3px" }}>
                                      IMAGE {index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGalleryItem(item.id)}
                                      style={{
                                        background: "none", border: "none",
                                        color: "var(--dashboard-text-muted)", cursor: "pointer",
                                        fontSize: "13px", padding: "2px 4px",
                                        borderRadius: "4px", transition: "color 0.15s",
                                      }}
                                      title="Remove this image"
                                      onMouseEnter={(e) => e.currentTarget.style.color = "#ff4d4d"}
                                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--dashboard-text-muted)"}
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </div>

                                  {/* URL input */}
                                  <input
                                    type="text"
                                    value={item.imageUrl}
                                    onChange={(e) => handleGalleryItemChange(item.id, "imageUrl", e.target.value)}
                                    className={styles.editorInput}
                                    placeholder="Paste image URL or use upload ←"
                                    style={{ fontSize: "12px" }}
                                  />

                                  {/* Caption textarea — no scrollbar */}
                                  <textarea
                                    value={item.text}
                                    onChange={(e) => handleGalleryItemChange(item.id, "text", e.target.value)}
                                    className={`${styles.editorInput} ${styles.scrollbarHidden}`}
                                    placeholder="Caption (optional)..."
                                    style={{ height: "52px", resize: "none", fontSize: "12px" }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extra / Additional images for gallery/carousel posts (separate from slider) */}
                      {formValues.format === "gallery" && (
                        <div className={styles.editorUploadCard} style={{ display: "block" }}>
                          {/* Header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                            <div>
                              <h3 className={styles.editorUploadTitle}>Additional Images &amp; Captions</h3>
                              <p className={styles.editorUploadText}>
                                Add more images beyond the slider — these will appear below the post content.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddExtraImage}
                              className={styles.toolbarButtonPrimary}
                              style={{ padding: "8px 16px", fontSize: "14px", flexShrink: 0 }}
                            >
                              <i className="fas fa-plus"></i>
                              <span>Add Image</span>
                            </button>
                          </div>

                          {/* Empty state */}
                          {extraImages.length === 0 && (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "32px 20px",
                                color: "var(--dashboard-text-muted)",
                                border: "1.5px dashed var(--dashboard-card-border)",
                                borderRadius: "10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <i className="far fa-images" style={{ fontSize: "28px", opacity: 0.4 }}></i>
                              <span style={{ fontSize: "13px" }}>No additional images yet. Click <strong>Add Image</strong> to start.</span>
                            </div>
                          )}

                          {/* Extra image items */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {extraImages.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  border: "1px solid var(--dashboard-card-border)",
                                  borderRadius: "12px",
                                  padding: "14px",
                                  background: "var(--dashboard-card-hover, rgba(0,0,0,0.02))",
                                  position: "relative",
                                  display: "flex",
                                  gap: "14px",
                                  alignItems: "flex-start",
                                }}
                              >
                                {/* Image preview / drop zone */}
                                <label
                                  style={{
                                    width: "110px",
                                    height: "90px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    background: item.previewUrl ? "transparent" : "var(--dashboard-bg, #0f0f13)",
                                    border: item.previewUrl ? "none" : "1.5px dashed var(--dashboard-card-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "border-color 0.2s",
                                  }}
                                  title="Click to upload image"
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleExtraImageFileChange(item.id, e)}
                                    style={{ display: "none" }}
                                  />
                                  {item.previewUrl ? (
                                    <>
                                      <Image
                                        src={item.previewUrl}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        style={{ objectFit: "cover" }}
                                      />
                                      {/* Replace overlay on hover */}
                                      <div style={{
                                        position: "absolute", inset: 0,
                                        background: "rgba(0,0,0,0.45)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        opacity: 0, transition: "opacity 0.2s",
                                        fontSize: "11px", color: "#fff", gap: "4px", flexDirection: "column",
                                      }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                      >
                                        <i className="fas fa-camera" style={{ fontSize: "16px" }}></i>
                                        Replace
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "var(--dashboard-text-muted)" }}>
                                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: "20px" }}></i>
                                      <span style={{ fontSize: "10px", fontWeight: 500 }}>Upload</span>
                                    </div>
                                  )}
                                </label>

                                {/* Right side: URL + caption */}
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
                                  {/* Block label + delete */}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--dashboard-text-soft)", letterSpacing: "0.3px" }}>
                                      EXTRA {index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExtraImage(item.id)}
                                      style={{
                                        background: "none", border: "none",
                                        color: "var(--dashboard-text-muted)", cursor: "pointer",
                                        fontSize: "13px", padding: "2px 4px",
                                        borderRadius: "4px", transition: "color 0.15s",
                                      }}
                                      title="Remove this image"
                                      onMouseEnter={(e) => e.currentTarget.style.color = "#ff4d4d"}
                                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--dashboard-text-muted)"}
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </div>

                                  {/* URL input */}
                                  <input
                                    type="text"
                                    value={item.imageUrl}
                                    onChange={(e) => handleExtraImageChange(item.id, "imageUrl", e.target.value)}
                                    className={styles.editorInput}
                                    placeholder="Paste image URL or use upload ←"
                                    style={{ fontSize: "12px" }}
                                  />

                                  {/* Caption textarea — no scrollbar */}
                                  <textarea
                                    value={item.text}
                                    onChange={(e) => handleExtraImageChange(item.id, "text", e.target.value)}
                                    className={`${styles.editorInput} ${styles.scrollbarHidden}`}
                                    placeholder="Caption (optional)..."
                                    style={{ height: "52px", resize: "none", fontSize: "12px" }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {formValues.format !== "gallery" && (
                        <>
                          <label className={styles.editorField}>
                            <span className={styles.editorLabel}>Featured Image Source</span>
                            <DashboardSelect
                              inputId="post-featured-image-source-select"
                              value={findSelectOption(featuredImageSourceOptions, featuredImageMode)}
                              onChange={(option) =>
                                handleFeaturedImageModeChange({ target: { value: option?.value || "upload" } })
                              }
                              options={featuredImageSourceOptions}
                              minHeight={44}
                              borderRadius={14}
                              fontSize={12}
                            />
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
                              {imagePreview ? (
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
                        </>
                      )}
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
                          <DashboardSelect
                            inputId="post-status-select"
                            value={findSelectOption(statusOptions, formValues.status)}
                            onChange={(option) =>
                              setFormValues((prev) => ({ ...prev, status: option?.value || "draft" }))
                            }
                            options={statusOptions}
                            minHeight={44}
                            borderRadius={14}
                            fontSize={12}
                          />
                        </label>

                        <div className={styles.editorChecklist}>
                          <div className={styles.editorToggleRow}>
                            <span>
                              <strong>Featured post</strong>
                              <small>Show this in the hero rotation.</small>
                            </span>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={formValues.isFeatured}
                              onClick={() => {
                                setFormValues(prev => ({
                                  ...prev,
                                  isFeatured: !prev.isFeatured
                                }));
                              }}
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: formValues.isFeatured ? "2px solid var(--dashboard-accent)" : "2px solid var(--dashboard-card-border)",
                                background: formValues.isFeatured ? "var(--dashboard-accent)" : "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                padding: 0,
                                transition: "all 0.15s ease",
                              }}
                              aria-label="Toggle featured post"
                            >
                              {formValues.isFeatured && (
                                <svg width="10" height="8" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          </div>

                          <div className={styles.editorToggleRow}>
                            <span>
                              <strong>Sticky recent post</strong>
                              <small>Keep this highlighted in the recent list.</small>
                            </span>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={formValues.isSticky}
                              onClick={() => {
                                setFormValues(prev => ({
                                  ...prev,
                                  isSticky: !prev.isSticky
                                }));
                              }}
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: formValues.isSticky ? "2px solid var(--dashboard-accent)" : "2px solid var(--dashboard-card-border)",
                                background: formValues.isSticky ? "var(--dashboard-accent)" : "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                padding: 0,
                                transition: "all 0.15s ease",
                              }}
                              aria-label="Toggle sticky post"
                            >
                              {formValues.isSticky && (
                                <svg width="10" height="8" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          </div>
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
                        {submitSuccess && (
                          <button
                            type="button"
                            className={styles.saveButton}
                            style={{
                              marginTop: "10px",
                              background: "transparent",
                              border: "1px solid var(--dashboard-card-border)",
                              color: "var(--dashboard-text-soft)"
                            }}
                            onClick={() => handleResetEditor(true)}
                          >
                            <i className="fas fa-plus" style={{ marginRight: "8px" }}></i>
                            Write New Post
                          </button>
                        )}
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

                    {/* SEO Tabs Style Card Redesign */}
                    <aside className={`${styles.panel} ${styles.editorSidebarPanel} ${styles.seoCardPanel}`}>
                      <div className={styles.seoCardHeader}>
                        <ul className={styles.seoTabsList}>
                          <li>
                            <button
                              type="button"
                              onClick={() => setSeoTab("seo")}
                              className={`${styles.seoTabBtn} ${seoTab === "seo" ? styles.seoTabBtnActive : ""}`}
                            >
                              <i className="fas fa-search"></i>
                              SEO
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => setSeoTab("social")}
                              className={`${styles.seoTabBtn} ${seoTab === "social" ? styles.seoTabBtnActive : ""}`}
                            >
                              <i className="fas fa-share-alt"></i>
                              Social
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => setSeoTab("advanced")}
                              className={`${styles.seoTabBtn} ${seoTab === "advanced" ? styles.seoTabBtnActive : ""}`}
                            >
                              <i className="fas fa-cog"></i>
                              Advanced
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Tab Content */}
                      <div className={styles.seoTabContent}>
                        {seoTab === "seo" && (
                          <>
                            <label className={styles.editorField}>
                              <span className={styles.editorLabel}>
                                SEO Title
                                <span style={{ fontSize: "10px", color: (formValues.seoTitle || formValues.title || "").length > 60 ? "#f1747b" : "var(--dashboard-text-muted)", marginLeft: "auto", fontWeight: 400 }}>
                                  {(formValues.seoTitle || formValues.title || "").length} / 60
                                </span>
                              </span>
                              <input
                                name="seoTitle"
                                value={formValues.seoTitle}
                                onChange={handleChange}
                                className={styles.editorInput}
                                placeholder={formValues.title || "Custom SEO title (optional)"}
                                autoComplete="off"
                                maxLength={120}
                              />
                            </label>

                            <label className={styles.editorField}>
                              <span className={styles.editorLabel} style={{ display: "flex", justifyContent: "space-between" }}>
                                Meta Description
                                <span style={{ fontSize: "10px", color: (formValues.seoDescription || formValues.excerpt || "").length > 160 ? "#f1747b" : "var(--dashboard-text-muted)", fontWeight: 400 }}>
                                  {(formValues.seoDescription || formValues.excerpt || "").length} / 160
                                </span>
                              </span>
                              <textarea
                                name="seoDescription"
                                value={formValues.seoDescription}
                                onChange={handleChange}
                                className={`${styles.editorInput} ${styles.editorTextarea} ${styles.editorTextareaCompact}`}
                                placeholder={formValues.excerpt || "Describe this post for search engines..."}
                                maxLength={320}
                              />
                            </label>

                            <div className={styles.seoInlineFields}>
                              <label className={styles.editorField}>
                                <span className={styles.editorLabel}>Slug (URL)</span>
                                <input
                                  name="slug"
                                  value={formValues.slug}
                                  onChange={handleSlugChange}
                                  className={styles.editorInput}
                                  placeholder="post-slug"
                                  autoComplete="off"
                                />
                              </label>

                              <label className={styles.editorField}>
                                <span className={styles.editorLabel}>Focus Keyword</span>
                                <input
                                  name="focusKeyword"
                                  value={focusKeyword}
                                  onChange={(e) => setFocusKeyword(e.target.value)}
                                  className={styles.editorInput}
                                  placeholder="e.g. minimalism"
                                  autoComplete="off"
                                />
                              </label>
                            </div>

                            <div className={styles.editorField}>
                              <span className={styles.editorLabel}>OG Image (For Social Share)</span>
                              <div className={styles.seoOgImageUploadBox}>
                                <div className={styles.seoOgImagePreview}>
                                  {uploadedOgPreview || formValues.ogImage || imagePreview ? (
                                    <img src={uploadedOgPreview || formValues.ogImage || imagePreview} alt="OG Preview" />
                                  ) : (
                                    <i className="far fa-image" style={{ fontSize: "24px", color: "var(--dashboard-text-muted)" }}></i>
                                  )}
                                </div>
                                <div className={styles.seoOgImageInfo}>
                                  <span className={styles.seoOgImageName}>
                                    {ogImageFile ? ogImageFile.name : formValues.ogImage ? formValues.ogImage.split("/").pop() : "og-image.jpg"}
                                  </span>
                                  <span className={styles.seoOgImageMeta}>1200 x 630 px (Recommended)</span>
                                </div>
                                <div className={styles.seoOgImageActions}>
                                  <button
                                    type="button"
                                    onClick={() => ogImageInputRef.current?.click()}
                                    className={styles.toolbarButton}
                                    style={{ height: "36px", minHeight: "36px", padding: "0 14px", fontSize: "13px" }}
                                  >
                                    Replace
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleOgFileDelete}
                                    className={styles.profileLogoutButton}
                                    style={{ width: "36px", height: "36px" }}
                                    title="Delete Image"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                  <input
                                    type="file"
                                    ref={ogImageInputRef}
                                    onChange={handleOgFileChange}
                                    accept="image/*"
                                    style={{ display: "none" }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* SEO Score Row */}
                            <div className={styles.seoScoreContainer}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className={styles.seoScoreLabel}>SEO Score</span>
                                <span className={`${styles.seoScoreBadge} ${seoScore >= 50 ? styles.seoScoreBadgeGood : styles.seoScoreBadgeBad}`}>
                                  {seoScore >= 70 ? "Excellent" : seoScore >= 50 ? "Good" : "Needs Work"}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div className={styles.seoProgressBarTrack}>
                                  <div className={styles.seoProgressBarFill} style={{ width: `${seoScore}%` }}></div>
                                </div>
                                <span className={styles.seoScoreText}>{seoScore} / 100</span>
                              </div>
                            </div>
                          </>
                        )}

                        {seoTab === "social" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Preview selector inside Social tab */}
                            <div style={{ display: "flex", gap: "8px", background: "var(--dashboard-card-soft)", borderRadius: "8px", padding: "4px", alignSelf: "flex-start" }}>
                              {[
                                { id: "google", label: "Google" },
                                { id: "facebook", label: "Facebook" },
                                { id: "twitter", label: "Twitter" }
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setSeoPreviewTab(t.id)}
                                  style={{
                                    border: "none",
                                    background: seoPreviewTab === t.id ? "var(--dashboard-card-bg)" : "transparent",
                                    color: seoPreviewTab === t.id ? "var(--dashboard-accent)" : "var(--dashboard-text-muted)",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: seoPreviewTab === t.id ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                                  }}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>

                            {/* Google Preview */}
                            {seoPreviewTab === "google" && (
                              <div style={{ border: "1px solid var(--dashboard-card-border)", borderRadius: "10px", padding: "14px", background: "var(--dashboard-card-bg)", fontFamily: "Arial, sans-serif" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#4285f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className="fas fa-globe" style={{ fontSize: "9px", color: "#fff" }}></i>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: "11px", color: "var(--dashboard-text-soft)", lineHeight: 1.2 }}>yourwebsite.com</div>
                                    <div style={{ fontSize: "10px", color: "var(--dashboard-text-muted)", lineHeight: 1.2 }}>
                                      yourwebsite.com › blog › {formValues.slug || "post-slug"}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontSize: "16px", color: "#1a0dab", fontWeight: 600, lineHeight: 1.3, marginBottom: "4px" }}>
                                  {formValues.seoTitle || formValues.title || "Post Title Will Appear Here"}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--dashboard-text-soft)", lineHeight: 1.4 }}>
                                  {formValues.seoDescription || formValues.excerpt || "Your meta description will appear here. Make it compelling so users click through from search results."}
                                </div>
                              </div>
                            )}

                            {/* Facebook Preview */}
                            {seoPreviewTab === "facebook" && (
                              <div style={{ border: "1px solid var(--dashboard-card-border)", borderRadius: "10px", overflow: "hidden", fontFamily: "Helvetica, Arial, sans-serif" }}>
                                <div style={{ width: "100%", aspectRatio: "1.91/1", background: "var(--dashboard-card-hover, rgba(0,0,0,0.02))", position: "relative", overflow: "hidden" }}>
                                    {uploadedOgPreview || formValues.ogImage || imagePreview ? (
                                      <img src={uploadedOgPreview || formValues.ogImage || imagePreview} alt="OG Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", color: "var(--dashboard-text-muted)" }}>
                                        <i className="far fa-image" style={{ fontSize: "28px" }}></i>
                                        <span style={{ fontSize: "11px" }}>Featured image will appear here</span>
                                      </div>
                                    )}
                                </div>
                                <div style={{ padding: "10px 12px", background: "var(--dashboard-card-soft)", borderTop: "1px solid var(--dashboard-card-border)" }}>
                                  <div style={{ fontSize: "10px", color: "#606770", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>YOURWEBSITE.COM</div>
                                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--dashboard-text)", lineHeight: "1.3", marginBottom: "2px" }}>
                                    {formValues.seoTitle || formValues.title || "Your Post Title"}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "var(--dashboard-text-muted)", lineHeight: "1.3" }}>
                                    {formValues.seoDescription || formValues.excerpt || "Post description will appear here."}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Twitter Preview */}
                            {seoPreviewTab === "twitter" && (
                              <div style={{ border: "1px solid var(--dashboard-card-border)", borderRadius: "12px", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                                <div style={{ width: "100%", aspectRatio: "2/1", background: "var(--dashboard-card-hover, rgba(0,0,0,0.02))", position: "relative", overflow: "hidden" }}>
                                    {uploadedOgPreview || formValues.ogImage || imagePreview ? (
                                      <img src={uploadedOgPreview || formValues.ogImage || imagePreview} alt="Twitter Card Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", color: "var(--dashboard-text-muted)" }}>
                                        <i className="far fa-image" style={{ fontSize: "28px" }}></i>
                                        <span style={{ fontSize: "11px" }}>OG image will appear here</span>
                                      </div>
                                    )}
                                </div>
                                <div style={{ padding: "10px 12px", background: "var(--dashboard-card-bg)", borderTop: "1px solid var(--dashboard-card-border)" }}>
                                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--dashboard-text)", lineHeight: "1.3", marginBottom: "2px" }}>
                                    {formValues.seoTitle || formValues.title || "Your Post Title"}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "var(--dashboard-text-muted)", lineHeight: "1.3", marginBottom: "4px" }}>
                                    {formValues.seoDescription || formValues.excerpt || "Post description will appear here."}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <i className="fas fa-link" style={{ fontSize: "9px" }}></i>
                                    yourwebsite.com
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {seoTab === "advanced" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <label className={styles.editorField}>
                              <span className={styles.editorLabel}>Meta Robots</span>
                              <DashboardSelect
                                inputId="post-meta-robots-select"
                                value={findSelectOption(robotsOptions, advancedRobots)}
                                onChange={(option) => setAdvancedRobots(option?.value || "index")}
                                options={robotsOptions}
                                minHeight={44}
                                borderRadius={14}
                                fontSize={12}
                              />
                            </label>

                            <label className={styles.editorField}>
                              <span className={styles.editorLabel}>Canonical URL</span>
                              <input
                                value={advancedCanonical}
                                onChange={(e) => setAdvancedCanonical(e.target.value)}
                                className={styles.editorInput}
                                placeholder="https://yourwebsite.com/canonical-url"
                                autoComplete="off"
                              />
                              <span className={styles.editorHint}>
                                Points search engines to the preferred URL if this is duplicate content.
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </aside>

                  </div>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>

      {showExcerptHelp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowExcerptHelp(false)}
        >
          <div
            style={{
              background: "var(--dashboard-card-bg)",
              border: "1px solid var(--dashboard-card-border)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "380px",
              padding: "20px",
              boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExcerptHelp(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "var(--dashboard-text-muted)",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--dashboard-text)" }}>
              Excerpt Placement Example
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Mock post card image */}
              <div
                style={{
                  width: "100%",
                  height: "160px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"
                  alt="Excerpt placement example"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              
              <div style={{ fontSize: "11px", color: "var(--dashboard-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <i className="far fa-folder"></i> Lifestyle
              </div>

              {/* Post Title */}
              <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--dashboard-text)", lineHeight: "1.3" }}>
                Does This Thing Bring Me Balance?
              </div>

              {/* Excerpt Label and Text */}
              <div 
                style={{ 
                  border: "1px dashed var(--dashboard-accent)", 
                  borderRadius: "6px", 
                  padding: "10px", 
                  background: "var(--dashboard-accent-soft, rgba(111, 111, 255, 0.05))",
                  position: "relative",
                  marginTop: "6px"
                }}
              >
                <span 
                  style={{ 
                    position: "absolute", 
                    top: "-8px", 
                    left: "10px", 
                    background: "var(--dashboard-accent)", 
                    color: "#fff", 
                    fontSize: "9px", 
                    fontWeight: "700", 
                    padding: "1px 6px", 
                    borderRadius: "3px",
                    textTransform: "uppercase"
                  }}
                >
                  Excerpt
                </span>
                <div style={{ fontSize: "12px", color: "var(--dashboard-text)", lineHeight: "1.5", marginTop: "2px" }}>
                  A short, catchy summary of your post that appears on the homepage to attract readers. Keep it engaging to increase clicks!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
