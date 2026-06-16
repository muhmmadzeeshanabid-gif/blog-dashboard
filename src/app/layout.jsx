import Script from "next/script";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "../lib/authContext";
import BodySync from "../components/layout/BodySync";


export const metadata = {
  title: "Orin - Minimal Blog For WordPress - Just another WordPress site",
  description: "Local-only Orin-inspired blog rendered from our own codebase.",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("orin_site_style")?.value;
  const isDark = theme === "dark";

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isDashboardOrLogin = pathname.startsWith("/dashboard") || pathname.startsWith("/login");

  const isDarkDashboardOrLogin = isDark || pathname.startsWith("/login");
  const bodyBgColor = isDarkDashboardOrLogin ? "#0d0d0f" : "#f7f8fb";

  let bodyClassName = `home blog wp-embed-responsive wp-theme-orin bwp-body bwp-sidebar-hidden`;
  if (!isDashboardOrLogin) {
    bodyClassName += " bwp-enable-sticky-header";
  }
  if (isDarkDashboardOrLogin) {
    bodyClassName += " bwp-dark-style";
  }




  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Poppins:ital,wght@0,300;0,500;0,600;0,700;1,600;1,700&family=Source+Sans+Pro:ital,wght@0,400;0,600;1,400&family=Yeseva+One&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/vendor/orin/css/magnific-popup.css" />
        <link rel="stylesheet" href="/vendor/orin/fontawesome/css/all.min.css" />
        <link rel="stylesheet" href="/vendor/orin/fontawesome/css/v5-font-face.min.css" />
        <style>{`
          :root {
            --font-poppins: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --font-lora: "Lora", Georgia, serif;
            --font-noto-serif: "Noto Serif", Georgia, serif;
            --font-open-sans: "Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --font-source-sans-pro: "Source Sans Pro", "Source Sans 3", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --font-yeseva-one: "Yeseva One", Georgia, serif;
          }
          .bwp-post-wrap:hover .bwp-post-content::before { width: 30px; }
          .bwp-footer-widgets-col-3 .wpcf7 .bwp-demo-contact-msg { height: 93px; }
          .bwp-font-types,
          #bwp-show-font-types,
          #bwp-dropdown-font-types { display: none !important; }
          .pagination .nav-links {
            display: flex;
            justify-content: center !important;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            text-align: center !important;
          }
          @media (max-width: 767px) {
            .pagination,
            .navigation.pagination,
            .pagination .nav-links {
              display: flex !important;
              justify-content: flex-start !important;
              text-align: left !important;
            }
            .pagination {
              padding-left: 30px !important;
            }
          }
          .bwp-dashboard-btn {
            float: right;
            height: 38px;
            line-height: 38px;
            margin-top: 16px;
            margin-left: 15px;
            margin-right: 5px;
            padding: 0 18px;
            font-family: var(--font-poppins), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff !important;
            background-color: #6f6fff;
            border: none;
            border-radius: 2px;
            text-decoration: none !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(111, 111, 255, 0.2);
          }
          .bwp-dashboard-btn:hover,
          .bwp-dashboard-btn:focus {
            background-color: #393940;
            color: #ffffff !important;
            transform: translateY(-1px);
            box-shadow: 0 6px 15px rgba(57, 57, 64, 0.25);
          }
          .bwp-dark-style .bwp-dashboard-btn {
            background-color: #8585ff;
            color: #121214 !important;
            box-shadow: 0 4px 10px rgba(133, 133, 255, 0.25);
          }
          .bwp-dark-style .bwp-dashboard-btn:hover,
          .bwp-dark-style .bwp-dashboard-btn:focus {
            background-color: #ffffff;
            color: #121214 !important;
            transform: translateY(-1px);
            box-shadow: 0 6px 15px rgba(255, 255, 255, 0.3);
          }
        `}</style>
      </head>
      <body
        className={bodyClassName}
        style={isDashboardOrLogin ? { backgroundColor: bodyBgColor, paddingTop: 0 } : {}}
        suppressHydrationWarning
      >
        <BodySync />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script id="orin-restore-style-cookie" strategy="beforeInteractive">{`
          (function () {
            var match = document.cookie.match(/(?:^|; )orin_site_style=([^;]*)/);
            var siteStyle = match ? decodeURIComponent(match[1]) : "";
            if (siteStyle === "dark") {
              if (document.body) document.body.classList.add("bwp-dark-style");
            } else {
              if (document.body) document.body.classList.remove("bwp-dark-style");
            }
          })();
        `}</Script>
      </body>
    </html>
  );
}
