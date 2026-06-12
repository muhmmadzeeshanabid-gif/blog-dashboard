const baseNavItems = [
  { label: "Overview", icon: "fas fa-home", href: "/dashboard" },
  { label: "Posts", icon: "fas fa-file-alt", href: "/dashboard/posts" },
  { label: "Categories", icon: "fas fa-folder" },
  { label: "Media", icon: "fas fa-image" },
  { label: "Analytics", icon: "fas fa-chart-bar" },
  { label: "Settings", icon: "fas fa-cog" },
];

export function getDashboardNavItems(activeHref = "/dashboard") {
  return baseNavItems.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
