"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./contact.module.css";
import useHeroSlider from "@/frontend/components/slider/useHeroSlider";

const FAQS_LEFT = [
  {
    question: "What type of content do you publish?",
    answer: "ORIN is a minimal blog dedicated to lifestyle, productivity, travel, wellness, and minimalism. We share ideas, advice, guides, and inspiration for living a simpler, more meaningful life."
  },
  {
    question: "Can I contribute to ORIN?",
    answer: "Yes! We are always open to guest contributions, stories, or columns that align with our core values of minimalism, wellness, and mindful living. Please contact us via email for guidelines."
  },
  {
    question: "How often do you post new articles?",
    answer: "We generally publish new articles twice a week. You can stay updated by checking the blog frequently or subscribing to our weekly newsletter."
  }
];

const FAQS_RIGHT = [
  {
    question: "Do you offer collaborations or partnerships?",
    answer: "Absolutely. We collaborate with brands, creators, and platforms that share our vision. Drop us a line with your proposal and ideas, and we will get back to you."
  },
  {
    question: "How can I stay updated with ORIN?",
    answer: "You can bookmark our homepage, follow our social media profiles on Instagram and Facebook, or subscribe to our newsletter for major releases."
  },
  {
    question: "Where can I follow ORIN on social media?",
    answer: "You can find us on Instagram, Facebook, and YouTube under our official handles. Links are available in our website header and footer."
  }
];

const HERO_SLIDES = [
  {
    image: "/images/contact-hero-1.png",
    label: "Contact Us",
    title: "We'd Love To Hear From You",
    subtitle: "Have a question, suggestion, or just want to say hello? We're here and happy to connect.",
    buttonText: "Send Us A Message"
  },
  {
    image: "/images/contact-hero-2.png",
    label: "Collaborate",
    title: "Let's Build Something Great",
    subtitle: "We are always open to guest posts, brand collaborations, and partnership opportunities.",
    buttonText: "Partner With Us"
  },
  {
    image: "/images/contact-hero-3.png",
    label: "Support",
    title: "Get In Touch With Our Team",
    subtitle: "Need help with something or want to report an issue? Drop us a line and we'll reply shortly.",
    buttonText: "Contact Support"
  }
];

export default function ContactClient({ initialSlides }) {
  // Math Captcha State
  const [num1, setNum1] = useState(39);
  const [num2, setNum2] = useState(46);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 40) + 10);
    setNum2(Math.floor(Math.random() * 40) + 10);
  }, []);
  
  // Form Input States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    captcha: ""
  });

  // Submission States
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [alertMsg, setAlertMsg] = useState("");

  // FAQ Accordion Open States
  const [openFaqs, setOpenFaqs] = useState({});

  // Slide state
  const slides = initialSlides && initialSlides.length > 0 ? initialSlides : HERO_SLIDES;
  useHeroSlider(slides);

  const handleScrollToForm = (e) => {
    e.preventDefault();
    const formSection = document.getElementById("contact-form-section");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFaqToggle = (faqKey) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [faqKey]: !prev[faqKey]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setAlertMsg("");

    const { name, email, subject, message, captcha } = formData;

    // Validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus("error");
      setAlertMsg("Please fill in all the fields.");
      return;
    }

    const expectedAnswer = num1 + num2;
    if (parseInt(captcha.trim(), 10) !== expectedAnswer) {
      setStatus("error");
      setAlertMsg(`Incorrect captcha answer. Please enter the correct sum of ${num1} + ${num2}.`);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          captchaQuestion: `${num1}+${num2}=?`,
          captchaAnswer: captcha
        })
      });

      if (res.ok) {
        setStatus("success");
        setAlertMsg("Thank you! Your message has been sent successfully.");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          captcha: ""
        });
        // Regenerate captcha
        setNum1(Math.floor(Math.random() * 40) + 10);
        setNum2(Math.floor(Math.random() * 40) + 10);
      } else {
        const data = await res.json();
        setStatus("error");
        setAlertMsg(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setAlertMsg("Something went wrong. Please check your internet connection and try again.");
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
                                href="#contact-form-section"
                                onClick={handleScrollToForm}
                                title={slide.label}
                              >
                                {slide.label}
                              </a>
                            </li>
                          </ul>
                          <h3 className="bwp-homepage-slider-post-title">
                            <a
                              href="#contact-form-section"
                              onClick={handleScrollToForm}
                              title={slide.title}
                            >
                              {slide.title}
                            </a>
                          </h3>
                          <a
                            href="#contact-form-section"
                            className="bwp-homepage-slider-read-more"
                            onClick={handleScrollToForm}
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

      {/* ── Get In Touch Section ── */}
      <section id="contact-form-section" className={styles.getInTouchSection}>
        <h2 className={styles.sectionTitle}>Get In Touch</h2>
        <p className={styles.sectionSubtitle}>
          We are always open to discussing new ideas, collaboration opportunities,
          or any feedback you may have.
        </p>

        <div className={styles.grid}>
          {/* Form Card */}
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>Send Us A Message</h3>

            {status === "success" ? (
              <div className={styles.successContainer} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "64px", color: "#10b981", marginBottom: "20px" }}>
                  <i className="fas fa-check-circle" />
                </div>
                <h4 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "10px", color: "var(--dashboard-text, #202025)" }}>Message Sent!</h4>
                <p style={{ fontSize: "14px", color: "#9898a4", marginBottom: "24px", lineHeight: "1.5" }}>
                  {alertMsg}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className={styles.submitButton}
                  style={{ width: "auto", padding: "10px 24px" }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                {status === "error" && (
                  <div className={`${styles.formAlert} ${styles.formAlertError}`} style={{ marginBottom: "20px" }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
                    {alertMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className={styles.inputGroup}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <textarea
                      name="message"
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className={styles.textareaField}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.captchaLabel}>
                      Please Enter Your Answer: {num1}+{num2}=?
                    </label>
                    <input
                      type="text"
                      name="captcha"
                      placeholder="Your Answer"
                      value={formData.captcha}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Info Column */}
          <div className={styles.infoCol}>
            {/* Email Us */}
            <div className={styles.infoCard}>
              <div className={styles.infoIconWrapper}>
                <i className="far fa-envelope" />
              </div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>Email Us</h4>
                <p className={styles.infoText}>hello@orin.com</p>
              </div>
            </div>

            {/* Call Us */}
            <div className={styles.infoCard}>
              <div className={styles.infoIconWrapper}>
                <i className="fas fa-phone-alt" />
              </div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>Call Us</h4>
                <p className={styles.infoText}>+123 456 7890</p>
              </div>
            </div>

            {/* Our Location */}
            <div className={styles.infoCard}>
              <div className={styles.infoIconWrapper}>
                <i className="fas fa-map-marker-alt" />
              </div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>Our Location</h4>
                <p className={styles.infoText}>
                  123, Minimal Street, New York,
                  United States
                </p>
              </div>
            </div>

            {/* Office Hours */}
            <div className={styles.infoCard}>
              <div className={styles.infoIconWrapper}>
                <i className="far fa-clock" />
              </div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>Office Hours</h4>
                <p className={styles.infoText}>
                  Monday - Friday: 9:00 AM - 6:00 PM{"\n"}
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="bwp-separator bwp-gradient" style={{ marginTop: "60px", marginBottom: "40px" }}>
        <span className="bwp-rhomb"></span>
      </div>

      {/* ── FAQ Section ── */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <p className={styles.sectionSubtitle}>Quick answers to common questions.</p>

        <div className={styles.faqGrid}>
          {/* Left Accordions Column */}
          <div>
            {FAQS_LEFT.map((faq, idx) => {
              const faqKey = `left-${idx}`;
              const isOpen = !!openFaqs[faqKey];
              return (
                <div key={faqKey} className={styles.faqItem}>
                  <div
                    className={styles.faqHeader}
                    onClick={() => handleFaqToggle(faqKey)}
                  >
                    <h4 className={styles.faqQuestion}>{faq.question}</h4>
                    <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconActive : ""}`}>
                      <i className="fas fa-plus" />
                    </span>
                  </div>
                  <div className={`${styles.faqBody} ${isOpen ? styles.faqBodyActive : ""}`}>
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Accordions Column */}
          <div>
            {FAQS_RIGHT.map((faq, idx) => {
              const faqKey = `right-${idx}`;
              const isOpen = !!openFaqs[faqKey];
              return (
                <div key={faqKey} className={styles.faqItem}>
                  <div
                    className={styles.faqHeader}
                    onClick={() => handleFaqToggle(faqKey)}
                  >
                    <h4 className={styles.faqQuestion}>{faq.question}</h4>
                    <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconActive : ""}`}>
                      <i className="fas fa-plus" />
                    </span>
                  </div>
                  <div className={`${styles.faqBody} ${isOpen ? styles.faqBodyActive : ""}`}>
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
