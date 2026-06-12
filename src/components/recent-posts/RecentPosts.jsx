"use client";

import Link from "next/link";
import Image from "next/image";
import useRecentPostsUi from "./useRecentPostsUi";

function RecentPostArticle({ post, extraClassName = "" }) {
  const categoryClass = post.category.toLowerCase().replace(/\s+/g, "-");

  return (
    <article
      id={`bwp-post-${post.id}`}
      className={`post-${post.id} post type-post status-publish format-${post.format} has-post-thumbnail ${post.isSticky ? "sticky" : ""} hentry category-${categoryClass} bwp-masonry-item bwp-col-3 bwp-post-has-title ${post.isSticky ? "bwp-width-2x" : ""} ${extraClassName}`.trim()}
    >
      <div className="bwp-post-wrap">
        {post.format === "image" && (
          <figure className="bwp-post-media">
            <Link href={post.permalink} title={post.title}>
              <Image width={post.imgWidth} height={post.imgHeight} src={post.image} className="attachment-full size-full wp-post-image" alt={post.title} priority={post.isSticky} />
              <div className="bwp-post-media-overlay"></div>
              <span className="bwp-post-hover-icon bwp-expand-image">
                <i className="fas fa-arrow-right"></i>
              </span>
            </Link>
          </figure>
        )}
        {post.format === "video" && (
          <figure className="bwp-post-media">
            <Link href={post.permalink} title={post.title}>
              <Image width={post.imgWidth} height={post.imgHeight} src={post.image} className="attachment-full size-full wp-post-image" alt={post.title} priority={post.isSticky} />
              <div className="bwp-post-media-overlay"></div>
              <span className="bwp-post-hover-icon bwp-expand-image">
                <i className="fas fa-arrow-right"></i>
              </span>
              <span className="bwp-post-format-icon">
                <i className="fas fa-video"></i>
              </span>
            </Link>
          </figure>
        )}
        {post.format === "gallery" && (
          <div className="bwp-post-media-slider">
            <div id={`bwp-post-slider-${post.id}`} className="bwp-post-slider">
              {post.galleryImages.map((img, idx) => (
                <figure key={idx} className="bwp-post-slider-item">
                  <Link href={post.permalink} title={img.title}>
                    <Image width={900} height={600} src={img.src} alt={img.alt} priority />
                    <div className="bwp-post-media-overlay"></div>
                    <span className="bwp-post-hover-icon bwp-expand-image">
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </Link>
                </figure>
              ))}
            </div>
          </div>
        )}
        <div className="bwp-post-content">
          {post.isSticky && (
            <div className="bwp-post-sticky-mark">
              <i className="fas fa-thumbtack"></i>
            </div>
          )}
          <ul className="bwp-post-metadata list-unstyled">
            <li className="bwp-author bwp-hidden">
              <Link href={post.permalink} rel="author">
                <span className="vcard author">
                  <span className="fn">
                    {post.author}
                  </span>
                </span>
              </Link>
            </li>
            <li className="bwp-date bwp-hidden">
              <Link href={post.permalink}>
                <span className="date updated">
                  {post.dateLabel}
                </span>
              </Link>
            </li>
            <li className="bwp-categories bwp-visible">
              <Link href={post.permalink} rel="category tag">
                {post.category}
              </Link>
            </li>
          </ul>
          <h3 className="bwp-post-title entry-title">
            <Link href={post.permalink}>
              {post.title}
            </Link>
          </h3>
          <div className="bwp-post-excerpt entry-content">
            <p>{post.excerpt}</p>
          </div>
          <div className="clearfix">
            <div className="bwp-post-read-more">
              <Link href={post.permalink}>
                {"Read More"}
              </Link>
            </div>
            <div className="bwp-post-counters">
              <Link href={post.permalink} className="bwp-views-counter">
                <span className="bwp-counter-number">
                  {post.views}
                </span>
              </Link>
              <Link href={post.permalink} className="bwp-comments-counter">
                <span className="bwp-counter-number">
                  {post.comments}
                </span>
              </Link>
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
}) {
  useRecentPostsUi();
  const featuredPost = posts.find((post) => post.id === featuredPostId) ?? posts[0];

  return (
    <>
    <section className="bwp-recent-posts-section bwp-site-section bwp-section-has-header">
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <header className="bwp-section-header">
        <h2 className="bwp-section-title">
          {" Recent Articles "}
          <span className="bwp-page-number">
            {` Page №${currentPage} `}
          </span>
        </h2>
        <p>
          {" All My Posts With Interesting Stories "}
        </p>
        <div className="bwp-section-header-separator"></div>
      </header>
      <div className="bwp-posts" role="main">
        <div className="bwp-posts-wrap">
          {featuredPost && (
            <RecentPostArticle post={featuredPost} extraClassName="bwp-recent-post-featured-mobile" />
          )}
          <div id="bwp-masonry" className="bwp-col-3-layout clearfix">
            <div className="bwp-col-size"></div>
            {posts.map((post) => (
              <RecentPostArticle
                key={post.id}
                post={post}
                extraClassName={post.id === featuredPost?.id ? "bwp-recent-post-featured-desktop" : ""}
              />
            ))}
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <nav className="navigation pagination" aria-label="Posts pagination">
          <h2 className="screen-reader-text">
            {"Posts pagination"}
          </h2>
          <div className="nav-links">
            {currentPage > 1 && (
              <Link className="prev page-numbers" href={currentPage - 1 === 1 ? "/" : `/?page=${currentPage - 1}`}>
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
                  href={pageNumber === 1 ? "/" : `/?page=${pageNumber}`}
                >
                  {pageNumber}
                </Link>
              )
            )}
            {currentPage < totalPages && (
              <Link className="next page-numbers" href={`/?page=${currentPage + 1}`}>
                <i className="fas fa-chevron-right"></i>
              </Link>
            )}
          </div>
        </nav>
      )}
    </section>
    </>
  );
}
