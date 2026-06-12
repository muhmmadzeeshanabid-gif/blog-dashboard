"use client";

import Link from "next/link";
import Image from "next/image";
import useHeroSlider from "./useHeroSlider";

export default function HeroSlider({ heroPosts = [] }) {
  useHeroSlider();

  return (
    <>
    <section className="bwp-homepage-slider-section bwp-site-section">
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <header className="bwp-section-header">
        <h2 className="bwp-section-title">
          {" Must-Read Articles "}
        </h2>
        <p>
          {" My Best Articles That I Recommend To Everyone "}
        </p>
        <div className="bwp-section-header-separator"></div>
      </header>
      <div className="bwp-homepage-slider-wrap">
        <div id="bwp-homepage-slider">
          {heroPosts.map((post, index) => (
            <div key={post.id} className={`bwp-homepage-slider-item bwp-homepage-slider-post-${post.id}`}>
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
              <Link
                href={post.permalink}
                className="bwp-homepage-slider-zoom-image"
                title={post.title}
              >
                <i className="fas fa-expand"></i>
              </Link>
              <div className="bwp-homepage-slider-item-content">
                <div className="bwp-homepage-slider-content-alignment">
                  <div className="bwp-homepage-slider-content-center">
                    <div className="bwp-homepage-slider-content-container">
                      <div className="bwp-homepage-slider-content-text">
                        <ul className="bwp-homepage-slider-post-metadata list-unstyled">
                          <li className="bwp-author">
                            <Link href={post.permalink} rel="author">
                              <span className="vcard author">
                                <span className="fn">{post.author}</span>
                              </span>
                            </Link>
                          </li>
                          <li className="bwp-date">
                            <Link href={post.permalink}>
                              <span className="date updated">{post.dateLabel}</span>
                            </Link>
                          </li>
                          <li className="bwp-categories">
                            <Link href={post.permalink} rel="category tag">
                              {post.category}
                            </Link>
                          </li>
                        </ul>
                        <h3 className="bwp-homepage-slider-post-title">
                          <Link href={post.permalink}>{post.title}</Link>
                        </h3>
                        <Link href={post.permalink} className="bwp-homepage-slider-read-more">
                          Read More
                          <i className="fas fa-long-arrow-alt-right"></i>
                        </Link>
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
    </>
  );
}
