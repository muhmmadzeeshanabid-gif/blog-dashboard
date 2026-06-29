"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import styles from "@/dashboard/components/dashboard.module.css";
import Sidebar from "@/dashboard/components/Sidebar";
import { DashboardSelect } from "@/dashboard/components/DashboardSelect";
import { useAuth } from "@/frontend/lib/authContext";
import { useNotifications } from "@/dashboard/lib/notificationsContext";
import { useDashboardSettings } from "../layout";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildTree(categories) {
  return categories.map((cat, i) => ({
    ...cat,
    id: cat.id ?? i,
    children: (cat.tags ?? []).slice(0, 4).map((tag, j) => ({
      id: `${cat.id ?? i}-${j}`,
      name: tag,
      slug: slugify(tag),
      total: Math.max(1, Math.floor((cat.published ?? 0) * 0.3)),
      isChild: true,
    })),
  }));
}

const ACCENT_COLORS = [
  { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", icon: "#6366f1" },
  { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", icon: "#a855f7" },
  { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: "#22c55e" },
  { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", icon: "#f97316" },
  { bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)", icon: "#ec4899" },
  { bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.2)", icon: "#14b8a6" },
  { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)", icon: "#eab308" },
  { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: "#ef4444" },
];

export default function CategoriesClient({ initialData, navItems, isDarkInitial, initialNotifications, initialLastUpdatedLabel }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(isDarkInitial);
  const {
    showSidebar: dbShowSidebar,
    sidebarPosition: dbSidebarPosition,
    isSidebarCollapsed,
    setIsSidebarCollapsed
  } = useDashboardSettings();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [checkedRows, setCheckedRows] = useState({});
  const [categories, setCategories] = useState(() => buildTree(initialData.categories));
  const [data, setData] = useState(initialData);
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: handleNotificationClick,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  } = useNotifications();
  const [openMenuId, setOpenMenuId] = useState(null);

  // Tab and form layout state
  const [activeTab, setActiveTab] = useState("categories");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form
  const [form, setForm] = useState({ name: "", slug: "", parent: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const nameInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
    const currentTheme = match ? decodeURIComponent(match[1]) : "";
    const isDarkCookie = currentTheme === "dark";
    if (isDarkCookie !== isDark) {
      setIsDark(isDarkCookie);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    const onMouseDown = (e) => {
      // Close search on outside click
      if (
        e.target instanceof Element &&
        !e.target.closest('[class*="searchBar"]') &&
        !e.target.closest('[aria-label*="Search"]') &&
        !e.target.closest('[aria-label*="search"]')
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }

      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);





  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.body.classList.toggle("bwp-dark-style", next);
    setThemeCookie(next);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name") next.slug = slugify(value);
      return next;
    });
    setFormError("");
  };

  const handleAddCategory = () => {
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const newId = Date.now();
      const newCat = {
        id: newId,
        name: form.name.trim(),
        slug: form.slug || slugify(form.name.trim()),
        published: 0,
        draft: 0,
        total: 0,
        tags: [],
        latestDate: "—",
        children: [],
      };
      setCategories((prev) => [newCat, ...prev]);
      setData((prev) => ({
        ...prev,
        categories: [newCat, ...prev.categories],
      }));
      setForm({ name: "", slug: "", parent: "", description: "" });
      setFormSuccess(`"${newCat.name}" added successfully.`);
      setIsFormOpen(false);
      setIsSubmitting(false);
      setTimeout(() => setFormSuccess(""), 3000);
    }, 500);
  };

  const handleAddSubcategory = () => {
    if (!form.name.trim()) {
      setFormError("Sub-category name is required.");
      return;
    }
    if (!form.parent) {
      setFormError("Please select a Parent Category.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const subName = form.name.trim();
      const subSlug = form.slug || slugify(subName);
      const newChild = {
        id: `sub-${Date.now()}`,
        name: subName,
        slug: subSlug,
        total: 0,
        isChild: true,
      };

      const updatedCategories = categories.map((cat) => {
        if (cat.slug === form.parent) {
          return {
            ...cat,
            tags: [...(cat.tags ?? []), subName],
            children: [...(cat.children ?? []), newChild],
          };
        }
        return cat;
      });

      setCategories(updatedCategories);
      setData((prev) => ({
        ...prev,
        categories: updatedCategories,
      }));
      setForm({ name: "", slug: "", parent: "", description: "" });
      setFormSuccess(`Sub-category "${subName}" added successfully.`);
      setIsFormOpen(false);
      setIsSubmitting(false);
      setTimeout(() => setFormSuccess(""), 3000);
    }, 500);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const { type, data: itemData } = deletingItem;

    if (type === "category") {
      const updatedCategories = categories.filter((c) => c.id !== itemData.id);
      setCategories(updatedCategories);
      setData((prev) => ({ ...prev, categories: updatedCategories }));
    } else if (type === "subcategory") {
      const updatedCategories = categories.map((cat) => {
        if (cat.slug === itemData.parentSlug) {
          return {
            ...cat,
            tags: (cat.tags ?? []).filter((t) => slugify(t) !== itemData.slug),
            children: (cat.children ?? []).filter((child) => child.id !== itemData.id),
          };
        }
        return cat;
      });
      setCategories(updatedCategories);
      setData((prev) => ({ ...prev, categories: updatedCategories }));
    }
    setDeletingItem(null);
  };

  const handleCloseForm = () => {
    setForm({ name: "", slug: "", parent: "", description: "" });
    setFormError("");
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleSaveEdit = () => {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (editingItem.type === "subcategory" && !form.parent) {
      setFormError("Parent Category is required.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const nameVal = form.name.trim();
      const slugVal = form.slug || slugify(nameVal);

      let updatedCategories;
      if (editingItem.type === "category") {
        updatedCategories = categories.map((cat) => {
          if (cat.id === editingItem.data.id) {
            return {
              ...cat,
              name: nameVal,
              slug: slugVal,
              description: form.description,
            };
          }
          return cat;
        });
      } else {
        const oldParentSlug = editingItem.data.parentSlug;
        const newParentSlug = form.parent;

        if (oldParentSlug === newParentSlug) {
          updatedCategories = categories.map((cat) => {
            if (cat.slug === oldParentSlug) {
              return {
                ...cat,
                tags: (cat.tags ?? []).map((t) => (slugify(t) === editingItem.data.slug ? nameVal : t)),
                children: (cat.children ?? []).map((child) => {
                  if (child.id === editingItem.data.id) {
                    return {
                      ...child,
                      name: nameVal,
                      slug: slugVal,
                    };
                  }
                  return child;
                }),
              };
            }
            return cat;
          });
        } else {
          updatedCategories = categories.map((cat) => {
            if (cat.slug === oldParentSlug) {
              return {
                ...cat,
                tags: (cat.tags ?? []).filter((t) => slugify(t) !== editingItem.data.slug),
                children: (cat.children ?? []).filter((child) => child.id !== editingItem.data.id),
              };
            }
            if (cat.slug === newParentSlug) {
              const newChild = {
                id: editingItem.data.id,
                name: nameVal,
                slug: slugVal,
                total: editingItem.data.total ?? 0,
                isChild: true,
              };
              return {
                ...cat,
                tags: [...(cat.tags ?? []), nameVal],
                children: [...(cat.children ?? []), newChild],
              };
            }
            return cat;
          });
        }
      }

      setCategories(updatedCategories);
      setData((prev) => ({ ...prev, categories: updatedCategories }));
      setForm({ name: "", slug: "", parent: "", description: "" });
      setEditingItem(null);
      setIsFormOpen(false);
      setFormSuccess("Changes saved successfully.");
      setIsSubmitting(false);
      setTimeout(() => setFormSuccess(""), 3000);
    }, 500);
  };

  const filtered = searchQuery
    ? categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : categories;

  const allSubcategories = categories.flatMap((cat) => {
    return (cat.children ?? []).map((child) => ({
      ...child,
      parentName: cat.name,
      parentSlug: cat.slug,
    }));
  });

  const filteredSubcategories = searchQuery
    ? allSubcategories.filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.parentName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allSubcategories;

  // Shared cell padding
  const tdBase = { verticalAlign: "middle", padding: "10px 12px" };
  const thBase = {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--dashboard-text-muted)",
    borderBottom: "1px solid var(--dashboard-border-soft)",
    background: "var(--dashboard-card-soft)",
  };

  const isLeft = dbSidebarPosition === "left";
  const layoutClass = `${styles.layout} ${isLeft ? "" : styles.layoutRight} ${isSidebarCollapsed
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
            activeHref="/dashboard/categories"
            sidebarPosition={dbSidebarPosition}
          />

          {/* ── Main wrapper ── */}
          <div className={styles.mainWrapper}>
            {/* Topbar */}
            <div className={styles.topbar}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setIsSidebarCollapsed((v) => !v)}
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
                <div className={styles.topOverlay} ref={notificationsRef}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ""}`}
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
                    onClick={() => setIsNotificationsOpen((v) => !v)}
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
                  aria-label="Search"
                  onClick={() => {
                    setIsSearchOpen((v) => !v);
                    setSearchQuery("");
                  }}
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
                          <i className="fas fa-home"></i>
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

            {/* Search bar */}
            {isSearchOpen && (
              <div className={styles.searchBar}>
                <div className={styles.searchField}>
                  <i className="fas fa-search"></i>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "categories" ? "Search categories..." : "Search sub-categories..."}
                    aria-label={activeTab === "categories" ? "Search categories" : "Search sub-categories"}
                  />
                </div>
                <span className={styles.searchMeta}>
                  {activeTab === "categories" ? (
                    `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                  ) : (
                    `${filteredSubcategories.length} result${filteredSubcategories.length !== 1 ? "s" : ""}`
                  )}
                </span>
              </div>
            )}

            {/* Tab selection navigation */}
            <nav
              style={{
                display: "flex",
                gap: "8px",
                margin: "12px 18px 0",
                borderBottom: "1px solid var(--dashboard-border-soft)",
                paddingBottom: "10px",
              }}
              aria-label="Category sections"
            >
              <button
                type="button"
                className={`${styles.settingsSidebarTab} ${activeTab === "categories" ? styles.settingsSidebarTabActive : ""}`}
                onClick={() => {
                  setActiveTab("categories");
                  handleCloseForm();
                }}
              >
                <i className="fas fa-folder" />
                <span className={styles.settingsTabTitle}>Categories</span>
              </button>

              <button
                type="button"
                className={`${styles.settingsSidebarTab} ${activeTab === "subcategories" ? styles.settingsSidebarTabActive : ""}`}
                onClick={() => {
                  setActiveTab("subcategories");
                  handleCloseForm();
                }}
              >
                <i className="fas fa-tag" />
                <span className={styles.settingsTabTitle}>Sub-categories</span>
              </button>
            </nav>

            {/* ── Two-column body ── */}
            <div className={styles.categoriesGrid}>
              {/* LEFT: table */}
              <div className={styles.categoriesTableCol}>
                {/* Heading row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "24px",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h1
                      style={{
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "var(--dashboard-text)",
                      }}
                    >
                      {activeTab === "categories" ? "Categories" : "Sub-categories"}
                    </h1>
                    <p
                      style={{
                        margin: "5px 0 0",
                        fontSize: "13px",
                        color: "var(--dashboard-text-muted)",
                      }}
                    >
                      {activeTab === "categories"
                        ? "Organise your content with categories."
                        : "Manage sub-categories (tags) under parent categories."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.toolbarButtonPrimary}
                    onClick={() => {
                      if (isFormOpen) {
                        handleCloseForm();
                      } else {
                        setIsFormOpen(true);
                        setTimeout(() => nameInputRef.current?.focus(), 50);
                      }
                    }}
                  >
                    <i className="fas fa-plus" style={{ fontSize: "11px" }}></i>
                    <span>
                      {activeTab === "categories"
                        ? (isFormOpen ? "Close Form" : "Add New Category")
                        : (isFormOpen ? "Close Form" : "Add New Sub-category")}
                    </span>
                  </button>
                </div>

                {/* Table card */}
                <div className={styles.tableCard}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thBase, width: "44px", padding: "10px 6px 10px 16px" }}></th>
                        <th style={thBase}>Name</th>
                        {activeTab === "subcategories" && <th style={thBase}>Parent Category</th>}
                        <th style={thBase}>Slug</th>
                        <th style={thBase}>Posts</th>
                        <th style={{ ...thBase, width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === "categories" ? (
                        filtered.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                padding: "56px",
                                textAlign: "center",
                                color: "var(--dashboard-text-muted)",
                              }}
                            >
                              <i
                                className="fas fa-tags"
                                style={{ fontSize: "28px", display: "block", marginBottom: "10px", opacity: 0.4 }}
                              ></i>
                              No categories found.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((cat, idx) => {
                            const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                            const isChecked = !!checkedRows[cat.id];

                            return (
                              <tr
                                key={`cat-${cat.id}`}
                                style={{
                                  background: isChecked
                                    ? "var(--dashboard-accent-soft)"
                                    : "transparent",
                                  borderBottom: "1px solid var(--dashboard-border-soft)",
                                  transition: "background 0.15s",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked)
                                    e.currentTarget.style.background =
                                      "var(--dashboard-card-soft)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked)
                                    e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <td
                                  style={{
                                    ...tdBase,
                                    padding: "10px 6px 10px 16px",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCheckedRows((prev) => ({
                                        ...prev,
                                        [cat.id]: !prev[cat.id],
                                      }))
                                    }
                                    aria-checked={isChecked}
                                    aria-label={`Select ${cat.name}`}
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: "4px",
                                      border: isChecked ? "2px solid var(--dashboard-accent)" : "2px solid var(--dashboard-card-border)",
                                      background: isChecked ? "var(--dashboard-accent)" : "transparent",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      padding: 0,
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    {isChecked && (
                                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                        <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </button>
                                </td>

                                {/* Name */}
                                <td style={tdBase}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "8px",
                                        background: color.bg,
                                        border: `1px solid ${color.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <i
                                        className="fas fa-tag"
                                        style={{ color: color.icon, fontSize: "11px" }}
                                      ></i>
                                    </div>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--dashboard-text)",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {cat.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Slug */}
                                <td style={tdBase}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "12px",
                                      color: "var(--dashboard-text-muted)",
                                      background: "var(--dashboard-border-soft)",
                                      padding: "2px 8px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    {cat.slug}
                                  </span>
                                </td>

                                {/* Posts */}
                                <td style={tdBase}>
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "14px",
                                      color: "var(--dashboard-text)",
                                    }}
                                  >
                                    {cat.total}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td style={{ ...tdBase, position: "relative" }} ref={openMenuId === cat.id ? menuRef : null}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                                    style={{
                                      background: openMenuId === cat.id ? "var(--dashboard-card-soft)" : "none",
                                      border: "1px solid " + (openMenuId === cat.id ? "var(--dashboard-card-border)" : "transparent"),
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      color: "var(--dashboard-text-muted)",
                                      fontSize: "14px",
                                      padding: "4px 8px",
                                      transition: "all 0.15s ease",
                                    }}
                                    aria-label={`Options for ${cat.name}`}
                                  >
                                    <i className="fas fa-ellipsis-h"></i>
                                  </button>

                                  {openMenuId === cat.id && (
                                    <div style={{
                                      position: "absolute",
                                      right: "8px",
                                      top: "calc(100% + 4px)",
                                      zIndex: 100,
                                      background: "var(--dashboard-card-bg)",
                                      border: "1px solid var(--dashboard-card-border)",
                                      borderRadius: "12px",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                                      minWidth: "160px",
                                      overflow: "hidden",
                                      padding: "6px",
                                    }}>
                                      <div style={{ padding: "8px 10px 6px", fontSize: "11px", fontWeight: 700, color: "var(--dashboard-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                        {cat.name}
                                      </div>
                                      {[
                                        { icon: "fa-pen", label: "Edit Category", color: "var(--dashboard-text)", action: "edit" },
                                        { icon: "fa-file-alt", label: "View Posts", color: "var(--dashboard-text)", action: "view" },
                                        { icon: "fa-trash", label: "Delete", color: "var(--dashboard-danger)", action: "delete" },
                                      ].map(({ icon, label, color, action }) => (
                                        <button
                                          key={label}
                                          type="button"
                                          onClick={() => {
                                            if (action === "edit") {
                                              setEditingItem({ type: "category", data: cat });
                                              setForm({
                                                name: cat.name,
                                                slug: cat.slug,
                                                parent: "",
                                                description: cat.description ?? "",
                                              });
                                              setIsFormOpen(true);
                                              setTimeout(() => nameInputRef.current?.focus(), 50);
                                            } else if (action === "delete") {
                                              setDeletingItem({ type: "category", data: cat });
                                            }
                                            setOpenMenuId(null);
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            width: "100%",
                                            padding: "8px 10px",
                                            background: "none",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            color,
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            textAlign: "left",
                                            transition: "background 0.12s",
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--dashboard-card-soft)"}
                                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                        >
                                          <i className={`fas ${icon}`} style={{ width: "14px", fontSize: "12px", opacity: 0.8 }}></i>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )
                      ) : (
                        filteredSubcategories.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                padding: "56px",
                                textAlign: "center",
                                color: "var(--dashboard-text-muted)",
                              }}
                            >
                              <i
                                className="fas fa-tags"
                                style={{ fontSize: "28px", display: "block", marginBottom: "10px", opacity: 0.4 }}
                              ></i>
                              No sub-categories found.
                            </td>
                          </tr>
                        ) : (
                          filteredSubcategories.map((sub, idx) => {
                            const isChecked = !!checkedRows[sub.id];

                            return (
                              <tr
                                key={`sub-${sub.id}`}
                                style={{
                                  background: isChecked
                                    ? "var(--dashboard-accent-soft)"
                                    : "transparent",
                                  borderBottom: "1px solid var(--dashboard-border-soft)",
                                  transition: "background 0.15s",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked)
                                    e.currentTarget.style.background =
                                      "var(--dashboard-card-soft)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked)
                                    e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <td
                                  style={{
                                    ...tdBase,
                                    padding: "10px 6px 10px 16px",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCheckedRows((prev) => ({
                                        ...prev,
                                        [sub.id]: !prev[sub.id],
                                      }))
                                    }
                                    aria-checked={isChecked}
                                    aria-label={`Select ${sub.name}`}
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: "4px",
                                      border: isChecked ? "2px solid var(--dashboard-accent)" : "2px solid var(--dashboard-card-border)",
                                      background: isChecked ? "var(--dashboard-accent)" : "transparent",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      padding: 0,
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    {isChecked && (
                                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                        <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </button>
                                </td>

                                {/* Name */}
                                <td style={tdBase}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div
                                      style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "7px",
                                        background: "var(--dashboard-border-soft)",
                                        border: "1px solid var(--dashboard-card-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <i
                                        className="fas fa-folder"
                                        style={{ color: "var(--dashboard-text-muted)", fontSize: "10px" }}
                                      ></i>
                                    </div>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--dashboard-text)",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {sub.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Parent Category */}
                                <td style={tdBase}>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--dashboard-accent)",
                                      background: "var(--dashboard-accent-soft)",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      fontWeight: 600,
                                      display: "inline-block",
                                    }}
                                  >
                                    {sub.parentName}
                                  </span>
                                </td>

                                {/* Slug */}
                                <td style={tdBase}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "11px",
                                      color: "var(--dashboard-text-muted)",
                                      background: "var(--dashboard-border-soft)",
                                      padding: "2px 8px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    {sub.slug}
                                  </span>
                                </td>

                                {/* Posts */}
                                <td style={tdBase}>
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "13px",
                                      color: "var(--dashboard-text-muted)",
                                    }}
                                  >
                                    {sub.total}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td style={{ ...tdBase, position: "relative" }} ref={openMenuId === sub.id ? menuRef : null}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(openMenuId === sub.id ? null : sub.id)}
                                    style={{
                                      background: openMenuId === sub.id ? "var(--dashboard-card-soft)" : "none",
                                      border: "1px solid " + (openMenuId === sub.id ? "var(--dashboard-card-border)" : "transparent"),
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      color: "var(--dashboard-text-muted)",
                                      fontSize: "14px",
                                      padding: "4px 8px",
                                      transition: "all 0.15s ease",
                                    }}
                                    aria-label={`Options for ${sub.name}`}
                                  >
                                    <i className="fas fa-ellipsis-h"></i>
                                  </button>

                                  {openMenuId === sub.id && (
                                    <div style={{
                                      position: "absolute",
                                      right: "8px",
                                      top: "calc(100% + 4px)",
                                      zIndex: 100,
                                      background: "var(--dashboard-card-bg)",
                                      border: "1px solid var(--dashboard-card-border)",
                                      borderRadius: "12px",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                                      minWidth: "160px",
                                      overflow: "hidden",
                                      padding: "6px",
                                    }}>
                                      <div style={{ padding: "8px 10px 6px", fontSize: "11px", fontWeight: 700, color: "var(--dashboard-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                        {sub.name}
                                      </div>
                                      {[
                                        { icon: "fa-pen", label: "Edit Subcategory", color: "var(--dashboard-text)", action: "edit" },
                                        { icon: "fa-trash", label: "Delete", color: "var(--dashboard-danger)", action: "delete" },
                                      ].map(({ icon, label, color, action }) => (
                                        <button
                                          key={label}
                                          type="button"
                                          onClick={() => {
                                            if (action === "edit") {
                                              setEditingItem({ type: "subcategory", data: sub });
                                              setForm({
                                                name: sub.name,
                                                slug: sub.slug,
                                                parent: sub.parentSlug,
                                                description: sub.description ?? "",
                                              });
                                              setIsFormOpen(true);
                                              setTimeout(() => nameInputRef.current?.focus(), 50);
                                            } else if (action === "delete") {
                                              setDeletingItem({ type: "subcategory", data: sub });
                                            }
                                            setOpenMenuId(null);
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            width: "100%",
                                            padding: "8px 10px",
                                            background: "none",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            color,
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            textAlign: "left",
                                            transition: "background 0.12s",
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--dashboard-card-soft)"}
                                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                        >
                                          <i className={`fas ${icon}`} style={{ width: "14px", fontSize: "12px", opacity: 0.8 }}></i>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT: Add Category form */}
              {isFormOpen && (
                <div className={styles.categoriesFormCol}>
                  <div className={styles.categoriesFormCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "var(--dashboard-text)",
                          }}
                        >
                          {editingItem ? `Edit ${editingItem.type === "category" ? "Category" : "Sub-category"}` : (activeTab === "categories" ? "Add New Category" : "Add New Sub-category")}
                        </h2>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "12px",
                            color: "var(--dashboard-text-muted)",
                          }}
                        >
                          {editingItem ? "Update the details below." : "Fill in the details below."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--dashboard-text-muted)",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "color 0.15s",
                        }}
                        aria-label="Close form"
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--dashboard-danger)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--dashboard-text-muted)"}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    {/* Success message */}
                    {formSuccess && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          marginBottom: "14px",
                          background: "rgba(34,197,94,0.1)",
                          color: "#16a34a",
                          fontSize: "12px",
                          fontWeight: 500,
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}
                      >
                        <i className="fas fa-check-circle" style={{ marginRight: "6px" }}></i>
                        {formSuccess}
                      </div>
                    )}

                    {/* Error message */}
                    {formError && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          marginBottom: "14px",
                          background: "rgba(239,68,68,0.08)",
                          color: "var(--dashboard-danger)",
                          fontSize: "12px",
                          fontWeight: 500,
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }}></i>
                        {formError}
                      </div>
                    )}

                    {/* Name */}
                    <FormField label="Name">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={form.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        placeholder={activeTab === "categories" ? "Enter category name" : "Enter sub-category name"}
                        style={inputStyle(formError && !form.name)}
                      />
                    </FormField>

                    {/* Slug */}
                    <FormField label="Slug">
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => handleFormChange("slug", e.target.value)}
                        placeholder="Enter slug"
                        style={{ ...inputStyle(false), fontFamily: "monospace" }}
                      />
                    </FormField>

                    {/* Parent Category */}
                    {activeTab === "subcategories" && (
                      <FormField label="Parent Category">
                        <DashboardSelect
                          inputId="category-parent-select"
                          value={
                            [
                              { value: "", label: "Select Parent Category..." },
                              ...categories.map((cat) => ({
                                value: cat.slug,
                                label: cat.name,
                              })),
                            ].find((option) => option.value === form.parent) || null
                          }
                          onChange={(option) => handleFormChange("parent", option?.value || "")}
                          options={[
                            { value: "", label: "Select Parent Category..." },
                            ...categories.map((cat) => ({
                              value: cat.slug,
                              label: cat.name,
                            })),
                          ]}
                          minHeight={42}
                          borderRadius={10}
                          fontSize={13}
                          hasError={Boolean(formError && !form.parent)}
                        />
                      </FormField>
                    )}

                    {/* Description */}
                    <FormField label="Description">
                      <textarea
                        value={form.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        placeholder="Enter description..."
                        rows={4}
                        style={{
                          ...inputStyle(false),
                          resize: "vertical",
                          minHeight: "80px",
                          fontFamily: "inherit",
                        }}
                      />
                    </FormField>

                    {/* Submit */}
                    <button
                      type="button"
                      className={styles.toolbarButtonPrimary}
                      onClick={editingItem ? handleSaveEdit : (activeTab === "categories" ? handleAddCategory : handleAddSubcategory)}
                      disabled={isSubmitting}
                      style={{ width: "100%", marginTop: "20px", minHeight: "42px" }}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>{editingItem ? "Saving..." : "Adding..."}</span>
                        </>
                      ) : (
                        <>
                          <i className={editingItem ? "fas fa-save" : "fas fa-plus"} style={{ fontSize: "11px" }}></i>
                          <span>{editingItem ? "Save Changes" : (activeTab === "categories" ? "Add Category" : "Add Sub-category")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {deletingItem && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: "var(--dashboard-card-bg)",
                    border: "1px solid var(--dashboard-card-border)",
                    borderRadius: "18px",
                    padding: "24px",
                    width: "100%",
                    maxWidth: "400px",
                    boxShadow: "var(--dashboard-shadow)",
                    animation: "scaleIn 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                      color: "var(--dashboard-danger)",
                    }}
                  >
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: "22px" }}></i>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Confirm Deletion</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--dashboard-text-soft)", margin: "0 0 24px", lineHeight: 1.5 }}>
                    Are you sure you want to delete the {deletingItem.type === "category" ? "category" : "sub-category"}{" "}
                    <strong>"{deletingItem.data.name}"</strong>? This action cannot be undone.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(null)}
                      className={styles.toolbarButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className={styles.toolbarButtonDanger}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--dashboard-text-soft)",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "10px",
    border: `1.5px solid ${hasError ? "var(--dashboard-danger)" : "var(--dashboard-card-border)"}`,
    background: "var(--dashboard-card-soft)",
    color: "var(--dashboard-text)",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    display: "block",
  };
}
