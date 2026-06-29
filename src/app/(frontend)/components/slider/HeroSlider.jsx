"use client";

import Image from "next/image";
import Link from "next/link";
import useHeroSlider from "./useHeroSlider";

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

export default function HeroSlider({ heroPosts = [] }) {
  useHeroSlider(heroPosts);

  return (
    <section className="bwp-homepage-slider-section bwp-site-section">
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <header className="bwp-section-header">
        <h2 className="bwp-section-title">{" Must-Read Articles "}</h2>
        <p>{" My Best Articles That I Recommend To Everyone "}</p>
        <div className="bwp-section-header-separator"></div>
      </header>
      <div className="bwp-homepage-slider-wrap bwp-popup-gallery">
        <div id="bwp-homepage-slider">
          {heroPosts.map((post, index) => (
            <div
              key={post.id}
              className={`bwp-homepage-slider-item bwp-homepage-slider-post-${post.id}`}
            >
              <div className="bwp-homepage-slider-item-bg">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="bwp-homepage-slider-item-overlay"></div>
              <a
                href={post.image}
                className="bwp-homepage-slider-zoom-image bwp-popup-gallery-item"
                title={`${post.title} * ${post.category}`}
                aria-label={`Open ${post.title} image`}
              >
                <i className="fas fa-expand"></i>
              </a>
              <div className="bwp-homepage-slider-item-content">
                <div className="bwp-homepage-slider-content-alignment">
                  <div className="bwp-homepage-slider-content-center">
                    <div className="bwp-homepage-slider-content-container">
                      <div className="bwp-homepage-slider-content-text">
                        <ul className="bwp-homepage-slider-post-metadata list-unstyled">
                          <li className="bwp-author">
                            <StaticAnchor title={post.author}>{post.author}</StaticAnchor>
                          </li>
                          <li className="bwp-date">
                            <StaticAnchor title={post.dateLabel}>
                              <span className="date updated">{post.dateLabel}</span>
                            </StaticAnchor>
                          </li>
                          <li className="bwp-categories">
                            {post.category.includes("://") ? (
                              <a href={post.category} title={post.category}>
                                {post.category}
                              </a>
                            ) : (
                              <Link href={post.category.startsWith("/") ? post.category : `/categories/${post.category.toLowerCase()}`} title={post.category}>
                                {post.category}
                              </Link>
                            )}
                          </li>
                        </ul>
                        <h3 className="bwp-homepage-slider-post-title">
                          {post.slug.includes("://") ? (
                            <a href={post.slug} title={post.title}>
                              {post.title}
                            </a>
                          ) : (
                            <Link href={post.slug.startsWith("/") ? post.slug : `/posts/${post.slug}`} title={post.title}>
                              {post.title}
                            </Link>
                          )}
                        </h3>
                        {post.slug.includes("://") ? (
                          <a
                            href={post.slug}
                            className="bwp-homepage-slider-read-more"
                            title={`Read more about ${post.title}`}
                          >
                            Read More
                            <i className="fas fa-long-arrow-alt-right"></i>
                          </a>
                        ) : (
                          <Link
                            href={post.slug.startsWith("/") ? post.slug : `/posts/${post.slug}`}
                            className="bwp-homepage-slider-read-more"
                            title={`Read more about ${post.title}`}
                          >
                            Read More
                            <i className="fas fa-long-arrow-alt-right"></i>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div id="bwp-homepage-slider-loading-icon">
          <i className="fas fa-palette fa-spin"></i>
        </div>
      </div>
    </section>
  );
}
