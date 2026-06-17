"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/authContext";
import styles from "./dashboard.module.css";

const baseNavItems = [
  { label: "Overview", icon: "fas fa-th-large", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-newspaper", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-tags", href: "/dashboard/categories" },
  { label: "Media", icon: "fas fa-photo-video", href: "/dashboard/media" },
  { label: "Analytics", icon: "fas fa-chart-line", href: "/dashboard/analytics" },
  { label: "Users", icon: "fas fa-users", href: "/dashboard/users" },
  { label: "Settings", icon: "fas fa-cog", href: "/dashboard/settings" },
];

export default function Sidebar({ isSidebarCollapsed, setIsSidebarCollapsed, activeHref }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setIsSidebarCollapsed(true);
    }
  }, [setIsSidebarCollapsed]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

      <div className={styles.sidebarNavScroll}>
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
        {!isSidebarCollapsed && (
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
          </>
        )}

        <div className={styles.profileCardContainer} ref={profileRef}>
          <div 
            className={styles.profileCard} 
            style={{ cursor: "pointer", justifyContent: isSidebarCollapsed ? "center" : "flex-start", padding: isSidebarCollapsed ? "8px 0" : "8px 14px" }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title={isSidebarCollapsed ? user?.name || "Profile Menu" : undefined}
          >
            <div className={styles.profileAvatar} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                user?.name ? user.name[0].toUpperCase() : "U"
              )}
            </div>
            {!isSidebarCollapsed && (
              <>
                <div className={styles.profileMeta}>
                  <strong>{user?.name || "Admin"}</strong>
                  <span style={{ textTransform: "capitalize" }}>{user?.role || "Author"}</span>
                </div>
                <i className={`fas fa-chevron-up ${styles.profileChevron}`} style={{
                  transform: isProfileOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease"
                }}></i>
              </>
            )}
          </div>

          {isProfileOpen && (
            <div className={`${styles.sidebarProfileDropdown} ${isSidebarCollapsed ? styles.sidebarProfileDropdownCollapsed : ""}`}>
              <div className={styles.sidebarProfileHeader}>
                <strong>{user?.name || "Admin"}</strong>
                <span>{user?.email || ""}</span>
              </div>
              <div className={styles.sidebarProfileDivider} />
              <Link href="/dashboard/settings" className={styles.sidebarProfileLink} onClick={() => setIsProfileOpen(false)}>
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </Link>
              <Link href="/" className={styles.sidebarProfileLink} onClick={() => setIsProfileOpen(false)}>
                <i className="fas fa-globe"></i>
                <span>View Site</span>
              </Link>
              <div className={styles.sidebarProfileDivider} />
              <button type="button" className={styles.sidebarProfileLogout} onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
