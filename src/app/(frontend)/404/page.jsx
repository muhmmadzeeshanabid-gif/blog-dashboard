import Link from "next/link";
import { Suspense } from "react";
import Header from "@/frontend/components/header/Header";
import Logo from "@/frontend/components/logo/Logo";
import Footer from "@/frontend/components/footer/Footer";
import FooterWidgets from "@/frontend/components/widgets/FooterWidgets";
import ScrollTop from "@/frontend/components/utils/ScrollTop";
import GalleryLightbox from "@/frontend/components/utils/GalleryLightbox";
import { getHomepageFeed } from "@/backend/lib/postStore";
import { getAppSettings } from "@/backend/lib/appSettings";

export const metadata = {
  title: "404 — Page Not Found | ORIN",
  description:
    "Oops! The page you are looking for does not exist. It may have been moved or deleted. Return to the ORIN homepage.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    title: "404 — Page Not Found | ORIN",
    description: "The page you are looking for does not exist. Go back to the ORIN homepage.",
    type: "website",
    siteName: "ORIN",
  },
  twitter: {
    card: "summary",
    title: "404 — Page Not Found | ORIN",
    description: "The page you are looking for does not exist.",
  },
};

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function mapWidgetPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    image: post.image,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    viewsLabel: String(post.totalViews ?? 0),
    commentsLabel:
      post.comments === 0 ? "No comments" : `${post.comments} Comments`,
    author: post.author,
  };
}

export default async function NotFoundPage() {
  let popularPosts = [];
  let randomPosts = [];

  try {
    const appSettings = await getAppSettings();
    const feed = await getHomepageFeed(1, appSettings.postsPerPage, {});
    popularPosts = (feed.popularPosts ?? []).map(mapWidgetPost);
    randomPosts = (feed.randomPosts ?? []).map(mapWidgetPost);
  } catch {
    // fallback to empty
  }

  return (
    <>
      <Suspense fallback={null}>
        <Header activeFormat="" formatSlugs={{}} />
      </Suspense>

      <div className="bwp-site-content">
        <div className="container">
          <Logo />

          <div className="bwp-404-wrap">
            <div className="bwp-404-box">
              <h2 className="bwp-404-title">Oops... Error 404</h2>
              <p className="bwp-404-subtitle">
                We are sorry, but the page you are looking for
                <br />
                does not exist.
              </p>
              <p className="bwp-404-hint">
                Please check entered address and try again or go to{" "}
                <Link href="/" className="bwp-404-link bwp-404-link-underline">
                  homepage
                </Link>
                .
              </p>
            </div>
          </div>

          <FooterWidgets popularPosts={popularPosts} randomPosts={randomPosts} />
        </div>
      </div>

      <Footer />
      <ScrollTop />
      <GalleryLightbox />

      <style>{`
        .bwp-404-wrap { padding: 40px 0 30px; }
        .bwp-404-box {
          border: 1px solid #e2e2e2;
          border-radius: 2px;
          text-align: center;
          padding: 60px 40px 70px;
          max-width: 100%;
          background-color: #ffffff;
          color: #1a1a1e;
        }
        .bwp-dark-style .bwp-404-box {
          background-color: transparent;
          border-color: rgba(255, 255, 255, 0.08);
          color: #e8e8e8;
        }
        .bwp-404-title {
          font-family: var(--font-lora, 'Lora', Georgia, serif);
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 18px;
          letter-spacing: -0.2px;
        }
        .bwp-404-subtitle {
          font-family: var(--font-open-sans, 'Open Sans', system-ui, sans-serif);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.65;
          margin: 0 0 14px;
        }
        .bwp-404-hint {
          font-family: var(--font-open-sans, 'Open Sans', system-ui, sans-serif);
          font-size: 13px;
          line-height: 1.65;
          margin: 0;
          opacity: 0.75;
          font-style: italic;
        }
        .bwp-404-link {
          color: var(--user-accent, #6f6fff);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .bwp-404-link:hover { opacity: 0.75; text-decoration: underline; }
        .bwp-404-link-underline { text-decoration: underline; }
        .bwp-404-link-underline:hover { opacity: 0.75; }
        @media (max-width: 600px) {
          .bwp-404-box { padding: 40px 20px 50px; }
          .bwp-404-title { font-size: 21px; }
        }
      `}</style>
    </>
  );
}
