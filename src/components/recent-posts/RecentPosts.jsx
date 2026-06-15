"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useRecentPostsUi from "./useRecentPostsUi";

function preventNavigation(event) {
  event.preventDefault();
}

function StaticAnchor({ children, className = "", title = "", ariaLabel = "" }) {
  return (
    <a
      href="#"
      className={className}
      title={title}
      aria-label={ariaLabel || title || undefined}
      onClick={preventNavigation}
    >
      {children}
    </a>
  );
}

function getVideoEmbedSource(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com") && parsedUrl.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsedUrl.searchParams.get("v")}`;
    }

    if (parsedUrl.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsedUrl.pathname.replace(/\//g, "")}`;
    }

    if (parsedUrl.hostname.includes("vimeo.com") && !parsedUrl.hostname.includes("player.")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url ?? ""));
}

function isDirectAudioFile(url) {
  return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(String(url ?? ""));
}

function LocalVideoPlayer({ videoUrl, poster, title }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="bwp-local-video-container" onClick={handlePlayClick}>
      <video
        ref={videoRef}
        controls={isPlaying}
        preload="metadata"
        poster={poster}
        onClick={(e) => {
          if (isPlaying) {
            e.stopPropagation();
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={videoUrl} />
      </video>
      {!isPlaying && (
        <div className="bwp-video-custom-overlay">
          <div className="bwp-video-play-btn">
            <i className="fas fa-play"></i>
          </div>
        </div>
      )}
    </div>
  );
}

function renderPostMedia(post) {
  const lightboxTitle = `${post.title} * ${post.excerpt}`;

  if (post.format === "image") {
    return (
      <figure className="bwp-post-media">
        <a href={post.image} className="bwp-popup-image" title={lightboxTitle}>
          <Image
            width={post.imgWidth}
            height={post.imgHeight}
            src={post.image}
            className="attachment-full size-full wp-post-image"
            alt={post.title}
            priority={post.isSticky}
          />
          <span className="bwp-post-media-overlay"></span>
          <span className="bwp-post-hover-icon bwp-expand-image">
            <i className="far fa-images"></i>
          </span>
        </a>
      </figure>
    );
  }

  if (post.format === "video") {
    return (
      <figure className="bwp-post-media">
        <Link href={`/posts/${post.slug}`} title={post.title}>
          <Image
            width={post.imgWidth}
            height={post.imgHeight}
            src={post.image}
            className="attachment-full size-full wp-post-image"
            alt={post.title}
            priority={post.isSticky}
          />
          <span className="bwp-post-media-overlay"></span>
          <span className="bwp-post-hover-icon bwp-expand-image">
            <i className="fas fa-video"></i>
          </span>
        </Link>
      </figure>
    );
  }

  if (post.format === "audio") {
    return (
      <figure className="bwp-post-media">
        <Link href={`/posts/${post.slug}`} title={post.title}>
          <Image
            width={post.imgWidth}
            height={post.imgHeight}
            src={post.image}
            className="attachment-full size-full wp-post-image"
            alt={post.title}
            priority={post.isSticky}
          />
          <span className="bwp-post-media-overlay"></span>
          <span className="bwp-post-hover-icon bwp-expand-image">
            <i className="fas fa-headphones-alt"></i>
          </span>
        </Link>
      </figure>
    );
  }

  if (post.format === "gallery") {
    return (
      <div className="bwp-post-media-slider bwp-popup-gallery">
        <div id={`bwp-post-slider-${post.id}`} className="bwp-post-slider">
          {post.galleryImages.map((img, idx) => (
            <figure key={idx} className="bwp-post-slider-item">
              <a href={img.src} className="bwp-popup-gallery-item" title={img.title}>
                <Image width={900} height={600} src={img.src} alt={img.alt} priority />
                <span className="bwp-post-media-overlay"></span>
                <span className="bwp-post-hover-icon bwp-expand-image">
                  <i className="far fa-images"></i>
                </span>
              </a>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function RecentPostArticle({ post, extraClassName = "" }) {
  const categoryClass = post.category.toLowerCase().replace(/\s+/g, "-");

  return (
    <article
      id={`bwp-post-${post.id}`}
      className={`post-${post.id} post type-post status-publish format-${post.format} has-post-thumbnail ${post.isSticky ? "sticky" : ""} hentry category-${categoryClass} bwp-masonry-item bwp-col-3 bwp-post-has-title ${post.isSticky ? "bwp-width-2x" : ""} ${extraClassName}`.trim()}
    >
      <div className="bwp-post-wrap">
        {renderPostMedia(post)}
        <div className="bwp-post-content">
          {post.isSticky && (
            <div className="bwp-post-sticky-mark">
              <i className="fas fa-thumbtack"></i>
            </div>
          )}
          <ul className="bwp-post-metadata list-unstyled">
            <li className="bwp-author bwp-hidden">
              <StaticAnchor title={post.author}>{post.author}</StaticAnchor>
            </li>
            <li className="bwp-date bwp-hidden">
              <StaticAnchor title={post.dateLabel}>
                <span className="date updated">{post.dateLabel}</span>
              </StaticAnchor>
            </li>
            <li className="bwp-categories bwp-visible">
              <StaticAnchor title={post.category}>{post.category}</StaticAnchor>
            </li>
          </ul>
          <h3 className="bwp-post-title entry-title">
            <Link href={`/posts/${post.slug}`} title={post.title}>{post.title}</Link>
          </h3>
          <div className="bwp-post-excerpt entry-content">
            <p>{post.excerpt}</p>
          </div>
          <div className="clearfix">
            <div className="bwp-post-read-more">
              <Link href={`/posts/${post.slug}`} title={`Read more about ${post.title}`}>Read More</Link>
            </div>
            <div className="bwp-post-counters">
              <StaticAnchor className="bwp-views-counter" title={`${post.views} views`}>
                <span className="bwp-counter-number">{post.views}</span>
              </StaticAnchor>
              <StaticAnchor className="bwp-comments-counter" title={`${post.comments} comments`}>
                <span className="bwp-counter-number">{post.comments}</span>
              </StaticAnchor>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RecentPosts({
  posts = [],
  featuredPostId = null,
  currentPage = 1,
  totalPages = 1,
  category = "",
  tag = "",
  searchQuery = "",
}) {
  useRecentPostsUi(posts, currentPage);
  const featuredPost = posts.find((post) => post.id === featuredPostId) ?? posts[0];

  const getPageUrl = (pageNumber) => {
    const params = new URLSearchParams();
    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (searchQuery) params.set("s", searchQuery);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <>
      <section className="bwp-recent-posts-section bwp-site-section bwp-section-has-header">
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <header className="bwp-section-header">
        {category || tag ? (
          <h2 className="bwp-category-tag-title bwp-section-title">
            <span className="bwp-category-title-prefix">
              {category ? "Category:" : "Tag:"}
            </span>
            {category ? category : `#${tag}`}
          </h2>
        ) : (
          <h2 className="bwp-section-title">
            {searchQuery ? `Search: "${searchQuery}"` : " Recent Articles "}
            <span className="bwp-page-number">{` Page No.${currentPage} `}</span>
          </h2>
        )}

        {category ? (
          <div className="bwp-archive-description">
            <p>All My Articles From This Category / You Can Change This Description</p>
          </div>
        ) : tag ? (
          <div className="bwp-archive-description">
            <p>All My Articles Tagged With #{tag}</p>
          </div>
        ) : (
          <p>
            {searchQuery ? (
              <Link href="/" style={{ color: "#6f6fff", fontWeight: "600", textDecoration: "underline" }}>
                Show all articles
              </Link>
            ) : (
              " All My Posts With Interesting Stories "
            )}
          </p>
        )}

        {(category || tag) && (
          <p style={{ marginTop: "10px" }}>
            <Link href="/" style={{ color: "#6f6fff", fontWeight: "600", textDecoration: "underline" }}>
              Show all articles
            </Link>
          </p>
        )}

        <div className="bwp-section-header-separator"></div>
      </header>
      <div className="bwp-posts" role="main">
        <div className="bwp-posts-wrap">
          {featuredPost && posts.length > 0 && (
            <RecentPostArticle
              post={featuredPost}
              extraClassName="bwp-recent-post-featured-mobile"
            />
          )}
          <div id="bwp-masonry" className="bwp-col-3-layout clearfix">
            <div className="bwp-col-size"></div>
            {posts.map((post) => (
              <RecentPostArticle
                key={post.id}
                post={post}
                extraClassName={
                  post.id === featuredPost?.id ? "bwp-recent-post-featured-desktop" : ""
                }
              />
            ))}
          </div>
          {posts.length === 0 && (
            <div className="bwp-no-results" style={{ textAlign: "center", padding: "40px 0", color: "var(--dashboard-text-muted)" }}>
              No articles found matching this filter.
            </div>
          )}
        </div>
      </div>
      {totalPages > 1 && (
        <nav className="navigation pagination" aria-label="Posts pagination">
          <h2 className="screen-reader-text">{"Posts pagination"}</h2>
          <div className="nav-links">
            {currentPage > 1 && (
              <Link
                className="prev page-numbers"
                href={getPageUrl(currentPage - 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) =>
              pageNumber === currentPage ? (
                <span key={pageNumber} aria-current="page" className="page-numbers current">
                  {pageNumber}
                </span>
              ) : (
                <Link
                  key={pageNumber}
                  className="page-numbers"
                  href={getPageUrl(pageNumber)}
                >
                  {pageNumber}
                </Link>
              )
            )}
            {currentPage < totalPages && (
              <Link className="next page-numbers" href={getPageUrl(currentPage + 1)}>
                <i className="fas fa-chevron-right"></i>
              </Link>
            )}
          </div>
        </nav>
      )}
    </section>
      <style>{`
        .bwp-local-video-container {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: pointer;
          background-color: #000;
          display: block;
        }

        .bwp-local-video-container video {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bwp-video-custom-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
          z-index: 15;
        }

        .bwp-local-video-container:hover .bwp-video-custom-overlay {
          background: rgba(0, 0, 0, 0.4);
        }

        .bwp-video-play-btn {
          width: 65px;
          height: 65px;
          background: rgba(0, 0, 0, 0.75);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 22px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          padding-left: 4px;
          border: 2px solid rgba(255, 255, 255, 0.8);
        }

        .bwp-local-video-container:hover .bwp-video-play-btn {
          transform: scale(1.1);
          background: #6f6fff;
          border-color: #ffffff;
          box-shadow: 0 6px 20px rgba(111, 111, 255, 0.4);
        }

        .bwp-dark-style .bwp-local-video-container:hover .bwp-video-play-btn {
          background: #8585ff;
          box-shadow: 0 6px 20px rgba(133, 133, 255, 0.4);
        }
      `}</style>
    </>
  );
}
