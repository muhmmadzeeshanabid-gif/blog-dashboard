"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";
import Sidebar from "../Sidebar";

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
  { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  icon: "#6366f1" },
  { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.2)",  icon: "#a855f7" },
  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)",   icon: "#22c55e" },
  { bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)",  icon: "#f97316" },
  { bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.2)",  icon: "#ec4899" },
  { bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.2)",  icon: "#14b8a6" },
  { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)",   icon: "#eab308" },
  { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: "#ef4444" },
];

export default function CategoriesClient({ initialData, navItems, isDarkInitial }) {
  const [isDark, setIsDark] = useState(isDarkInitial);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [checkedRows, setCheckedRows] = useState({});
  const [categories, setCategories] = useState(() => buildTree(initialData.categories));
  const [data, setData] = useState(initialData);

  // Form
  const [form, setForm] = useState({ name: "", slug: "", parent: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notificationsRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    const onMouseDown = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
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
      setIsSubmitting(false);
      setTimeout(() => setFormSuccess(""), 3000);
    }, 500);
  };

  const filtered = searchQuery
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

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

  return (
    <div className={`${styles.pageShell} ${isDark ? styles.pageShellDark : ""}`}>
      <div className={`${styles.frame} ${isDark ? styles.frameDark : ""}`}>
        <div
          className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutSidebarCollapsed : ""}`}
        >
          <Sidebar
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeHref="/dashboard/categories"
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
                    onClick={() => setIsNotificationsOpen((v) => !v)}
                  >
                    <i className="fas fa-bell"></i>
                  </button>
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
                <button type="button" className={styles.iconButton} aria-label="Profile">
                  <i className="fas fa-user"></i>
                </button>
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
                    placeholder="Search categories..."
                    aria-label="Search categories"
                  />
                </div>
                <span className={styles.searchMeta}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

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
                      Categories
                    </h1>
                    <p
                      style={{
                        margin: "5px 0 0",
                        fontSize: "13px",
                        color: "var(--dashboard-text-muted)",
                      }}
                    >
                      Organise your content with categories.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.toolbarButtonPrimary}
                    onClick={() => nameInputRef.current?.focus()}
                  >
                    <i className="fas fa-plus" style={{ fontSize: "11px" }}></i>
                    <span>+ Add New Category</span>
                  </button>
                </div>

                {/* Table card */}
                <div className={styles.tableCard}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thBase, width: "44px", padding: "10px 6px 10px 16px" }}></th>
                        <th style={thBase}>Name</th>
                        <th style={thBase}>Slug</th>
                        <th style={thBase}>Posts</th>
                        <th style={{ ...thBase, width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
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
                          const isExpanded = !!expandedRows[cat.id];
                          const isChecked = !!checkedRows[cat.id];
                          const hasChildren = cat.children && cat.children.length > 0;

                          return (
                            // ✅ key on Fragment — fixes console warning
                            <Fragment key={`cat-${cat.id}`}>
                              {/* Parent row */}
                              <tr
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
                                {/* Chevron + checkbox */}
                                <td
                                  style={{
                                    ...tdBase,
                                    padding: "10px 6px 10px 16px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    {hasChildren ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedRows((prev) => ({
                                            ...prev,
                                            [cat.id]: !prev[cat.id],
                                          }))
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: "2px",
                                          color: "var(--dashboard-text-muted)",
                                          fontSize: "10px",
                                          lineHeight: 1,
                                          transform: isExpanded
                                            ? "rotate(0deg)"
                                            : "rotate(-90deg)",
                                          transition: "transform 0.2s",
                                        }}
                                        aria-label={
                                          isExpanded
                                            ? "Collapse subcategories"
                                            : "Expand subcategories"
                                        }
                                      >
                                        <i className="fas fa-chevron-down"></i>
                                      </button>
                                    ) : (
                                      <span style={{ width: "16px", display: "inline-block" }}></span>
                                    )}
                                    <input
                                      type="checkbox"
                                      style={{
                                        width: "14px",
                                        height: "14px",
                                        cursor: "pointer",
                                        accentColor: "var(--dashboard-accent)",
                                      }}
                                      checked={isChecked}
                                      onChange={() =>
                                        setCheckedRows((prev) => ({
                                          ...prev,
                                          [cat.id]: !prev[cat.id],
                                        }))
                                      }
                                    />
                                  </div>
                                </td>

                                {/* Name */}
                                <td style={tdBase}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
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
                                <td style={tdBase}>
                                  <button
                                    type="button"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--dashboard-text-muted)",
                                      fontSize: "14px",
                                      padding: "4px 6px",
                                    }}
                                    aria-label={`Options for ${cat.name}`}
                                  >
                                    <i className="fas fa-ellipsis-h"></i>
                                  </button>
                                </td>
                              </tr>

                              {/* Children rows */}
                              {isExpanded &&
                                hasChildren &&
                                cat.children.map((child) => (
                                  <tr
                                    key={`child-${child.id}`}
                                    style={{
                                      background: checkedRows[child.id]
                                        ? "var(--dashboard-accent-soft)"
                                        : "var(--dashboard-card-soft)",
                                      borderBottom:
                                        "1px solid var(--dashboard-border-soft)",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!checkedRows[child.id])
                                        e.currentTarget.style.background =
                                          "var(--dashboard-border-soft)";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!checkedRows[child.id])
                                        e.currentTarget.style.background =
                                          "var(--dashboard-card-soft)";
                                    }}
                                  >
                                    <td
                                      style={{
                                        ...tdBase,
                                        padding: "8px 6px 8px 16px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          paddingLeft: "22px",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          style={{
                                            width: "14px",
                                            height: "14px",
                                            cursor: "pointer",
                                            accentColor: "var(--dashboard-accent)",
                                          }}
                                          checked={!!checkedRows[child.id]}
                                          onChange={() =>
                                            setCheckedRows((prev) => ({
                                              ...prev,
                                              [child.id]: !prev[child.id],
                                            }))
                                          }
                                        />
                                      </div>
                                    </td>
                                    <td style={{ ...tdBase, paddingLeft: "44px" }}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                        }}
                                      >
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
                                            style={{
                                              color: "var(--dashboard-text-muted)",
                                              fontSize: "10px",
                                            }}
                                          ></i>
                                        </div>
                                        <span
                                          style={{
                                            fontSize: "13px",
                                            color: "var(--dashboard-text-soft)",
                                          }}
                                        >
                                          {child.name}
                                        </span>
                                      </div>
                                    </td>
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
                                        {child.slug}
                                      </span>
                                    </td>
                                    <td style={tdBase}>
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          fontSize: "13px",
                                          color: "var(--dashboard-text-muted)",
                                        }}
                                      >
                                        {child.total}
                                      </span>
                                    </td>
                                    <td style={tdBase}>
                                      <button
                                        type="button"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          color: "var(--dashboard-border-soft)",
                                          fontSize: "14px",
                                          padding: "4px 6px",
                                        }}
                                        aria-label={`Options for ${child.name}`}
                                      >
                                        <i className="fas fa-ellipsis-h"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT: Add Category form */}
              <div className={styles.categoriesFormCol}>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--dashboard-text)",
                  }}
                >
                  Add New Category
                </h2>
                <p
                  style={{
                    margin: "0 0 18px",
                    fontSize: "12px",
                    color: "var(--dashboard-text-muted)",
                  }}
                >
                  Fill in the details below.
                </p>

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
                    placeholder="Enter category name"
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
                <FormField label="Parent Category">
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.parent}
                      onChange={(e) => handleFormChange("parent", e.target.value)}
                      style={{
                        ...inputStyle(false),
                        appearance: "none",
                        cursor: "pointer",
                        paddingRight: "32px",
                      }}
                    >
                      <option value="">No Parent</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <i
                      className="fas fa-chevron-down"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "10px",
                        color: "var(--dashboard-text-muted)",
                        pointerEvents: "none",
                      }}
                    ></i>
                  </div>
                </FormField>

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
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  style={{ width: "100%", marginTop: "20px", minHeight: "42px" }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus" style={{ fontSize: "11px" }}></i>
                      <span>Add Category</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
