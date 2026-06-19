const baseNavItems = [
  { label: "Overview", icon: "fas fa-th-large", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-newspaper", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-tags", href: "/dashboard/categories" },
  { label: "Sliders & Widgets", icon: "fas fa-sliders-h", href: "/dashboard/highlights" },
  { label: "Media", icon: "fas fa-photo-video", href: "/dashboard/media" },
  { label: "Analytics", icon: "fas fa-chart-line", href: "/dashboard/analytics" },
  { label: "Users", icon: "fas fa-users", href: "/dashboard/users" },
  { label: "Settings", icon: "fas fa-cog", href: "/dashboard/settings" },
];

export function getDashboardNavItems(activeHref = "/dashboard") {
  return baseNavItems.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
