"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/authContext";
import styles from "./dashboard.module.css";

const baseNavItems = [
  { label: "Overview", icon: "fas fa-th-large", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-newspaper", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-tags", href: "/dashboard/categories" },
  { label: "Media", icon: "fas fa-photo-video" },
  { label: "Analytics", icon: "fas fa-chart-line", href: "/dashboard/analytics" },
  { label: "Users", icon: "fas fa-users", href: "/dashboard/users" },
  { label: "Settings", icon: "fas fa-cog", href: "/dashboard/settings" },
];

export default function Sidebar({ isSidebarCollapsed, setIsSidebarCollapsed, activeHref }) {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setIsSidebarCollapsed(true);
    }
  }, [setIsSidebarCollapsed]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const filteredNavItems = baseNavItems.filter((item) => {
    if (user?.role !== "admin") {
      return item.label !== "Categories" && item.label !== "Analytics" && item.label !== "Users";
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.sidebarScroll}>
        <div>
          <div className={styles.sidebarTop}>
            {!isSidebarCollapsed && (
              <div className={styles.sidebarTopText} style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "14px" }}>
                <span className={styles.brandWordmark} style={{ fontSize: "20px" }}>ORIN</span>
              </div>
            )}
            <button
              type="button"
              className={styles.sidebarToggle}
              style={isSidebarCollapsed ? {} : { marginLeft: "auto" }}
              aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
              onClick={handleSidebarToggle}
            >
              <i className={`fas fa-${isSidebarCollapsed ? "bars" : "times"}`}></i>
            </button>
          </div>

          {!isSidebarCollapsed && (
            <span className={styles.sidebarSectionHeader}>Pages</span>
          )}

          <nav className={styles.nav} aria-label="Sidebar navigation">
            {filteredNavItems.map((item) => {
              const isActive = item.href === activeHref;
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={isActive ? styles.navItemActive : styles.navItem}
                  title={item.label}
                >
                  <i className={`${item.icon} ${styles.navIcon}`}></i>
                  <span className={styles.navText}>{item.label}</span>
                </Link>
              ) : (
                <span
                  key={item.label}
                  className={`${isActive ? styles.navItemActive : styles.navItem} ${styles.navItemMuted}`}
                  title={item.label}
                >
                  <i className={`${item.icon} ${styles.navIcon}`}></i>
                  <span className={styles.navText}>{item.label}</span>
                </span>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          {!isSidebarCollapsed ? (
            <>
              <span className={styles.sidebarSectionHeader} style={{ marginTop: 0 }}>Quick Actions</span>
              <Link
                href="/dashboard/posts/new"
                className={styles.sidebarNewPostBtn}
                title="Create a new post"
              >
                <i className="fas fa-plus"></i>
                <span>New Post</span>
              </Link>

              <div className={styles.profileCard}>
                <div className={styles.profileAvatar} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user?.name ? user.name[0].toUpperCase() : "U"
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <strong>{user?.name || "Admin"}</strong>
                  <span style={{ textTransform: "capitalize" }}>{user?.role || "Author"}</span>
                </div>
                <i className={`fas fa-chevron-down ${styles.profileChevron}`}></i>
              </div>

              <button
                type="button"
                className={styles.sidebarLogoutRow}
                title="Logout"
                onClick={handleLogout}
              >
                <div className={styles.logoutIconWrapper}>
                  <i className="fas fa-sign-out-alt"></i>
                </div>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className={styles.profileCard} style={{ justifyContent: "center", padding: "8px 0" }}>
              <div className={styles.profileAvatar} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : "U"
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
