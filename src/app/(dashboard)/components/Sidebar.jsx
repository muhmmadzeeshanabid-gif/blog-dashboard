"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/frontend/lib/authContext";
import styles from "@/dashboard/components/dashboard.module.css";

const baseNavItems = [
  { label: "Overview", icon: "fas fa-th-large", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-newspaper", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-folder", href: "/dashboard/categories" },
  { label: "Sliders & Widgets", icon: "fas fa-sliders-h", href: "/dashboard/highlights" },
  { label: "Media", icon: "fas fa-photo-video", href: "/dashboard/media" },
  { label: "Analytics", icon: "fas fa-chart-line", href: "/dashboard/analytics" },
  { label: "Users", icon: "fas fa-users", href: "/dashboard/users" },
  { label: "Messages", icon: "fas fa-envelope", href: "/dashboard/messages" },
  { label: "Team", icon: "fas fa-user-friends", href: "/dashboard/team" },
  { label: "Settings", icon: "fas fa-cog", href: "/dashboard/settings" },
];

export default function Sidebar({ isSidebarCollapsed, setIsSidebarCollapsed, activeHref, sidebarPosition = "left" }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);

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

      // Close sidebar on mobile when clicking outside
      if (
        typeof window !== "undefined" &&
        window.innerWidth < 992 &&
        !isSidebarCollapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        const isToggleButton = e.target.closest("button") && 
          (e.target.closest("button").ariaLabel === "Toggle sidebar" || 
           e.target.closest("button").querySelector(".fa-bars") || 
           e.target.closest("button").querySelector(".fa-times"));
           
        if (!isToggleButton) {
          setIsSidebarCollapsed(true);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSidebarCollapsed, setIsSidebarCollapsed]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const filteredNavItems = baseNavItems.filter((item) => {
    if (user?.role !== "admin") {
      return (
        item.label !== "Categories" &&
        item.label !== "Sliders & Widgets" &&
        item.label !== "Analytics" &&
        item.label !== "Users" &&
        item.label !== "Messages" &&
        item.label !== "Team"
      );
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sidebarClass = `${styles.sidebar} ${
    isSidebarCollapsed ? styles.sidebarCollapsed : ""
  }`;

  return (
    <aside className={sidebarClass} ref={sidebarRef}>
      <div className={styles.sidebarTop} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        {!isSidebarCollapsed && (
          <div className={styles.sidebarTopText} style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "14px" }}>
            <Link href="/" className={styles.brandWordmark} style={{ fontSize: "20px" }}>ORIN</Link>
          </div>
        )}
        {!isSidebarCollapsed && (
          <button
            type="button"
            className={styles.sidebarCloseButton}
            onClick={() => setIsSidebarCollapsed(true)}
            aria-label="Close sidebar"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
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
            <div className={styles.profileAvatar} style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {user?.avatar ? (
                <Image src={user.avatar} alt={user?.name || "User Avatar"} fill sizes="40px" style={{ objectFit: "cover" }} />
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
                <i className="fas fa-home"></i>
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
