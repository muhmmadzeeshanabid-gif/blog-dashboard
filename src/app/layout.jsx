import Script from "next/script";
import { Poppins, Lora, Noto_Serif, Open_Sans, Source_Sans_3, Yeseva_One } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const lora = Lora({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const notoSerif = Noto_Serif({
  weight: ["400", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  display: "swap",
});

const openSans = Open_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-open-sans",
  display: "swap",
});

const sourceSansPro = Source_Sans_3({
  weight: ["400", "600"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-sans-pro",
  display: "swap",
});

const yesevaOne = Yeseva_One({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-yeseva-one",
  display: "swap",
});

export const metadata = {
  title: "Orin - Minimal Blog For WordPress - Just another WordPress site",
  description: "Local-only Orin-inspired blog rendered from our own codebase.",
};

export default function RootLayout({ children }) {
  const bodyClassName = "home blog wp-embed-responsive wp-theme-orin bwp-body bwp-sidebar-hidden bwp-enable-sticky-header";

  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/vendor/orin/css/magnific-popup.css" />
        <link rel="stylesheet" href="/vendor/orin/fontawesome/css/all.min.css" />
        <link rel="stylesheet" href="/vendor/orin/fontawesome/css/v5-font-face.min.css" />
        <style>{`
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
            border-radius: 20px;
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
        className={`${bodyClassName} ${poppins.variable} ${lora.variable} ${notoSerif.variable} ${openSans.variable} ${sourceSansPro.variable} ${yesevaOne.variable}`}
        suppressHydrationWarning
      >
        {children}
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
