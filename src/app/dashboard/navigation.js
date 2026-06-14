const baseNavItems = [
  { label: "Overview", icon: "fas fa-th-large", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-newspaper", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-tags", href: "/dashboard/categories" },
  { label: "Media", icon: "fas fa-photo-video" },
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
