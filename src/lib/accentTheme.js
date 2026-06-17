export const ACCENT_THEMES = {
  indigo: {
    name: "Indigo",
    color: "#6f6fff",
    light: { accent: "#6f6fff", soft: "rgba(111, 111, 255, 0.1)" },
    dark: { accent: "#9292ff", soft: "rgba(146, 146, 255, 0.14)" }
  },
  emerald: {
    name: "Emerald",
    color: "#10b981",
    light: { accent: "#10b981", soft: "rgba(16, 185, 129, 0.1)" },
    dark: { accent: "#34d399", soft: "rgba(52, 211, 153, 0.14)" }
  },
  rose: {
    name: "Rose",
    color: "#f43f5e",
    light: { accent: "#f43f5e", soft: "rgba(244, 63, 94, 0.1)" },
    dark: { accent: "#fb7185", soft: "rgba(251, 113, 133, 0.14)" }
  },
  amber: {
    name: "Amber",
    color: "#d97706",
    light: { accent: "#d97706", soft: "rgba(217, 119, 6, 0.1)" },
    dark: { accent: "#fbbf24", soft: "rgba(251, 191, 36, 0.14)" }
  },
  teal: {
    name: "Teal",
    color: "#0d9488",
    light: { accent: "#0d9488", soft: "rgba(13, 148, 136, 0.1)" },
    dark: { accent: "#2dd4bf", soft: "rgba(45, 212, 191, 0.14)" }
  },
  orange: {
    name: "Orange",
    color: "#ea580c",
    light: { accent: "#ea580c", soft: "rgba(234, 88, 12, 0.1)" },
    dark: { accent: "#fb923c", soft: "rgba(251, 146, 60, 0.14)" }
  },
  purple: {
    name: "Purple",
    color: "#8b5cf6",
    light: { accent: "#8b5cf6", soft: "rgba(139, 92, 246, 0.1)" },
    dark: { accent: "#a78bfa", soft: "rgba(167, 139, 250, 0.14)" }
  }
};

export function getAccentCookie() {
  if (typeof document === "undefined") return "indigo";
  const match = document.cookie.match(/(?:^|; )orin_site_accent=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "indigo";
}

export function setAccentCookie(accent) {
  if (typeof document !== "undefined") {
    document.cookie = `orin_site_accent=${accent}; path=/; max-age=31536000`;
  }
}

export function applyAccent(accentName = "indigo") {
  if (typeof document === "undefined") return;
  const isDark = document.body.classList.contains("bwp-dark-style");
  const themeData = ACCENT_THEMES[accentName] || ACCENT_THEMES.indigo;
  const config = isDark ? themeData.dark : themeData.light;
  document.documentElement.style.setProperty("--user-accent", config.accent);
  document.documentElement.style.setProperty("--user-accent-soft", config.soft);
}
