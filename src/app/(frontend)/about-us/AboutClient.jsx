"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./about.module.css";
import useHeroSlider from "@/frontend/components/slider/useHeroSlider";

const HERO_SLIDES = [
  {
    image: "/images/about-hero.png",
    label: "About Us",
    title: "A Space for Calm, Clarity & Creativity",
    subtitle: "ORIN is more than a blog — it's a lifestyle. We create content that helps you slow down, focus on what matters and live a more meaningful life.",
    buttonText: "Our Mission",
    targetId: "mission-section"
  },
  {
    image: "/images/about-story.png",
    label: "Our Story",
    title: "The Story Behind ORIN",
    subtitle: "ORIN started with a simple idea — to create a space where people can find peace, inspiration and clarity in everyday life.",
    buttonText: "Read Our Story",
    targetId: "story-section"
  },
  {
    image: "/images/about-hero-3.png",
    label: "Our Community",
    title: "Join A Creative & Mindful Journey",
    subtitle: "Explore our topics, connect with our creators, and get mindful updates directly in your inbox.",
    buttonText: "Meet The Team",
    targetId: "team-section"
  }
];

function formatSimpleStat(num) {
  return (num || 0) + "+";
}

function formatReaderStat(num) {
  if (!num) return "0+";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  }
  return num + "+";
}

function AnimatedCounter({ target, duration = 2000, isReaders = false }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) {
      setCount(0);
      return;
    }

    let active = true;
    const end = parseInt(target, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      if (!active) return;

      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // easeOutQuad easing
      const easeProgress = progress * (2 - progress);
      const currentCount = Math.floor(easeProgress * end);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      active = false;
    };
  }, [hasStarted, target, duration]);

  return (
    <span ref={elementRef}>
      {isReaders ? formatReaderStat(count) : formatSimpleStat(count)}
    </span>
  );
}

export default function AboutClient({ initialSlides, articlesCount = 0, categoriesCount = 0, readersCount = 0 }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, submitting, success
  const [msg, setMsg] = useState("");

  const slides = initialSlides && initialSlides.length > 0 ? initialSlides : HERO_SLIDES;

  useHeroSlider(slides);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setMsg("Thank you! You have successfully subscribed to our newsletter.");
      setEmail("");

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setMsg("");
      }, 5000);
    }, 1200);
  };

  const handleScrollToSection = (e, targetId) => {
    e.preventDefault();
    const section = document.getElementById(targetId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ── Hero Section (Slider) ── */}
      <section className="bwp-homepage-slider-section bwp-site-section" style={{ marginTop: "30px", marginBottom: "50px" }}>
        <div className="bwp-homepage-slider-wrap bwp-popup-gallery">
          <div id="bwp-homepage-slider">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`bwp-homepage-slider-item bwp-homepage-slider-post-${index}`}
              >
                <div className="bwp-homepage-slider-item-bg">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
                <div className="bwp-homepage-slider-item-overlay"></div>
                <a
                  href={slide.image}
                  className="bwp-homepage-slider-zoom-image bwp-popup-gallery-item"
                  title={`${slide.title} * ${slide.label}`}
                  aria-label={`Open ${slide.title} image`}
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
                              <a href="#" onClick={(e) => e.preventDefault()} title={slide.author || "Admin"}>
                                {slide.author || "Admin"}
                              </a>
                            </li>
                            <li className="bwp-date">
                              <a href="#" onClick={(e) => e.preventDefault()} title={slide.date || "May 29, 2026"}>
                                <span className="date updated">{slide.date || "May 29, 2026"}</span>
                              </a>
                            </li>
                            <li className="bwp-categories">
                              <a
                                href={`#${slide.targetId}`}
                                onClick={(e) => handleScrollToSection(e, slide.targetId)}
                                title={slide.label}
                              >
                                {slide.label}
                              </a>
                            </li>
                          </ul>
                          <h3 className="bwp-homepage-slider-post-title">
                            <a
                              href={`#${slide.targetId}`}
                              onClick={(e) => handleScrollToSection(e, slide.targetId)}
                              title={slide.title}
                            >
                              {slide.title}
                            </a>
                          </h3>
                          <a
                            href={`#${slide.targetId}`}
                            className="bwp-homepage-slider-read-more"
                            onClick={(e) => handleScrollToSection(e, slide.targetId)}
                            title={slide.buttonText}
                          >
                            {slide.buttonText}
                            <i className="fas fa-long-arrow-alt-right"></i>
                          </a>
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

      {/* ── 2. Our Mission Section ── */}
      <section id="mission-section" className={styles.missionSection}>
        <h2 className={styles.sectionTitle}>Our Mission</h2>
        <div className="bwp-section-header-separator" style={{ margin: "10px auto 25px auto" }}></div>
        <p className={styles.missionText}>
          To inspire and empower people through thoughtful content on minimal living,<br />
          productivity, personal growth and everyday inspiration.
        </p>

        {/* Values Grid */}
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <div className={styles.valueIconWrapper}>
              <i className="far fa-heart" />
            </div>
            <h3 className={styles.valueTitle}>Simplicity</h3>
            <p className={styles.valueText}>
              We believe less is more and simplicity leads to true happiness.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.valueIconWrapper}>
              <i className="far fa-bookmark" />
            </div>
            <h3 className={styles.valueTitle}>Inspiration</h3>
            <p className={styles.valueText}>
              We share ideas that inspire you to live with purpose and positivity.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.valueIconWrapper}>
              <i className="far fa-check-circle" />
            </div>
            <h3 className={styles.valueTitle}>Quality</h3>
            <p className={styles.valueText}>
              We are committed to delivering high-quality, trustworthy content.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.valueIconWrapper}>
              <i className="far fa-comments" />
            </div>
            <h3 className={styles.valueTitle}>Community</h3>
            <p className={styles.valueText}>
              We build a supportive community of like-minded individuals.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCol}>
            <div className={styles.statNum}><AnimatedCounter target={5} /></div>
            <div className={styles.statLabel}>Years Experience</div>
          </div>
          <div className={styles.statCol}>
            <div className={styles.statNum}><AnimatedCounter target={articlesCount} /></div>
            <div className={styles.statLabel}>Articles Published</div>
          </div>
          <div className={styles.statCol}>
            <div className={styles.statNum}><AnimatedCounter target={readersCount} isReaders={true} /></div>
            <div className={styles.statLabel}>Happy Readers</div>
          </div>
          <div className={styles.statCol}>
            <div className={styles.statNum}><AnimatedCounter target={categoriesCount} /></div>
            <div className={styles.statLabel}>Categories</div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="bwp-separator bwp-gradient" style={{ marginTop: "60px", marginBottom: "60px" }}>
        <span className="bwp-rhomb"></span>
      </div>

      {/* ── 3. Our Story Section ── */}
      <section id="story-section" className={styles.storySection}>
        <div className={styles.storyLeft}>
          <span className={styles.storyLabel}>Our Story</span>
          <h2 className={styles.storyTitle}>The Story Behind ORIN</h2>
          <p className={styles.storyText}>
            ORIN started with a simple idea — to create a space where people can find peace, inspiration and clarity in everyday life.
          </p>
          <p className={styles.storyText}>
            What began as a personal journal soon grew into a platform that connects with thousands of readers around the world.
          </p>
          <p className={styles.storyText}>
            Today, ORIN is a trusted destination for meaningful content on minimal living, productivity, wellness and personal growth.
          </p>
          <div className={styles.signature}>– Team ORIN</div>
        </div>
        <div className={styles.storyRight}>
          <div className={styles.storyImageWrapper}>
            <Image
              src="/images/about-story.png"
              alt="ORIN Armchair and Reading Corner"
              fill
              className={styles.storyImage}
              sizes="(max-width: 991px) 100vw, 480px"
            />
          </div>
        </div>
      </section>

      {/* ── 4. What We Cover Section ── */}
      <section className={styles.coverSection}>
        <h2 className={styles.sectionTitle}>What We Cover</h2>
        <div className="bwp-section-header-separator" style={{ margin: "10px auto 25px auto" }}></div>
        <p className={styles.missionText}>
          Topics that help you live a better, simpler and more intentional life.
        </p>

        <div className={styles.coverGrid}>
          <div className={styles.coverCard}>
            <div className={styles.coverIconWrapper}>
              <i className="far fa-heart" />
            </div>
            <h3 className={styles.coverTitle}>Minimalism</h3>
            <p className={styles.coverText}>
              Tips and guides for living with less and loving more.
            </p>
          </div>

          <div className={styles.coverCard}>
            <div className={styles.coverIconWrapper}>
              <i className="far fa-check-circle" />
            </div>
            <h3 className={styles.coverTitle}>Productivity</h3>
            <p className={styles.coverText}>
              Practical advice to help you work smarter.
            </p>
          </div>

          <div className={styles.coverCard}>
            <div className={styles.coverIconWrapper}>
              <i className="far fa-star" />
            </div>
            <h3 className={styles.coverTitle}>Wellness</h3>
            <p className={styles.coverText}>
              Mind, body and soul care for a balanced life.
            </p>
          </div>

          <div className={styles.coverCard}>
            <div className={styles.coverIconWrapper}>
              <i className="far fa-leaf" style={{ fontFamily: "Font Awesome 5 Free", fontWeight: "900" }} />
            </div>
            <h3 className={styles.coverTitle}>Lifestyle</h3>
            <p className={styles.coverText}>
              Ideas for a calm, meaningful lifestyle.
            </p>
          </div>

          <div className={styles.coverCard}>
            <div className={styles.coverIconWrapper}>
              <i className="far fa-lightbulb" />
            </div>
            <h3 className={styles.coverTitle}>Inspiration</h3>
            <p className={styles.coverText}>
              Stories and thoughts that inspire you.
            </p>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="bwp-separator bwp-gradient" style={{ marginTop: "60px", marginBottom: "60px" }}>
        <span className="bwp-rhomb"></span>
      </div>

      {/* ── 5. Meet The Team Section ── */}
      <section id="team-section" className={styles.teamSection}>
        <h2 className={styles.sectionTitle}>Meet The Team</h2>
        <div className="bwp-section-header-separator" style={{ margin: "10px auto 25px auto" }}></div>
        <p className={styles.missionText}>
          The people behind ORIN who create, write and bring ideas to life.
        </p>

        <div className={styles.teamGrid}>
          {/* Member 1 */}
          <div className={styles.teamCard}>
            <div className={styles.teamImageWrapper}>
              <Image
                src="/images/team-ayesha.png"
                alt="Ayesha Khan - Founder & Writer"
                fill
                className={styles.teamImage}
                sizes="180px"
              />
            </div>
            <h3 className={styles.teamName}>Ayesha Khan</h3>
            <div className={styles.teamRole}>Founder & Writer</div>
            <p className={styles.teamBio}>
              Lover of minimal living, productivity, and sharing ideas that inspire.
            </p>
            <div className={styles.teamSocials}>
              <a href="#" className={`${styles.socialLink} ${styles.xShare}`} aria-label="X"><i className="fab fa-x-twitter" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.instagramShare}`} aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.pinterestShare}`} aria-label="Pinterest"><i className="fab fa-pinterest-p" /></a>
            </div>
          </div>

          {/* Member 2 */}
          <div className={styles.teamCard}>
            <div className={styles.teamImageWrapper}>
              <Image
                src="/images/team-sara.png"
                alt="Sara Ahmed - Content Creator"
                fill
                className={styles.teamImage}
                sizes="180px"
              />
            </div>
            <h3 className={styles.teamName}>Sara Ahmed</h3>
            <div className={styles.teamRole}>Content Creator</div>
            <p className={styles.teamBio}>
              Passionate about wellness, creativity, and mindful living.
            </p>
            <div className={styles.teamSocials}>
              <a href="#" className={`${styles.socialLink} ${styles.xShare}`} aria-label="X"><i className="fab fa-x-twitter" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.instagramShare}`} aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.pinterestShare}`} aria-label="Pinterest"><i className="fab fa-pinterest-p" /></a>
            </div>
          </div>

          {/* Member 3 */}
          <div className={styles.teamCard}>
            <div className={styles.teamImageWrapper}>
              <Image
                src="/images/team-usman.png"
                alt="Usman Ali - Editor & Researcher"
                fill
                className={styles.teamImage}
                sizes="180px"
              />
            </div>
            <h3 className={styles.teamName}>Usman Ali</h3>
            <div className={styles.teamRole}>Editor & Researcher</div>
            <p className={styles.teamBio}>
              Focused on simplifying complex ideas into practical content.
            </p>
            <div className={styles.teamSocials}>
              <a href="#" className={`${styles.socialLink} ${styles.xShare}`} aria-label="X"><i className="fab fa-x-twitter" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.instagramShare}`} aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" className={`${styles.socialLink} ${styles.pinterestShare}`} aria-label="Pinterest"><i className="fab fa-pinterest-p" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Join Our Community (Newsletter Banner) ── */}
      <section className={styles.newsletterCard}>
        <div className={styles.newsletterLeft}>
          <div className={styles.newsletterIconWrapper}>
            <i className="far fa-envelope" />
          </div>
          <div className={styles.newsletterContent}>
            <h3 className={styles.newsletterTitle}>Join Our Community</h3>
            <p className={styles.newsletterText}>
              Be part of our journey. Get the latest articles, tips and inspiration straight to your inbox.
            </p>
          </div>
        </div>

        <div className={styles.newsletterFormContainer}>
          {status === "success" ? (
            <div className={styles.newsletterSuccess}>
              <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
              {msg}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.newsletterInput}
                required
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className={styles.newsletterButton}
              >
                {status === "submitting" ? "Subscribing..." : "Subscribe Now"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
