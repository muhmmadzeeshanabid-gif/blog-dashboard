"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

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

function WidgetPostList({ posts = [], numbered = false }) {
  return (
    <ul className="list-unstyled">
      {posts.map((post, index) => (
        <li key={post.id}>
          <figure className="widget_bwp_thumbnail">
            <Link href={`/posts/${post.slug}`} title={post.title}>
              <Image
                width={200}
                height={200}
                src={post.image}
                className="attachment-orin-200-200-crop size-orin-200-200-crop wp-post-image"
                alt={post.title}
                loading="lazy"
              />
              <div className="widget_bwp_bg_overlay"></div>
            </Link>
          </figure>
          {numbered && (
            <span className="widget_bwp_popular_post_num">{` ${index + 1} `}</span>
          )}
          <div className="widget_bwp_content">
            <h4 className="entry-title">
              <Link href={`/posts/${post.slug}`} title={post.title}>{post.title}</Link>
            </h4>
            <ul className="widget_bwp_meta list-unstyled clearfix">
              <li>
                <StaticAnchor title={post.dateLabel}>
                  <span className="date updated">{post.dateLabel}</span>
                </StaticAnchor>
              </li>
              {numbered ? (
                <>
                  <li className="widget_bwp_views_count">
                    <StaticAnchor title={`${post.viewsLabel} views`}>
                      {` Views: ${post.viewsLabel} `}
                    </StaticAnchor>
                  </li>
                </>
              ) : (
                <li>
                  <StaticAnchor title={post.author}>{post.author}</StaticAnchor>
                </li>
              )}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FooterWidgets({ popularPosts = [], randomPosts = [] }) {
  const [num1, setNum1] = useState(39);
  const [num2, setNum2] = useState(46);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 40) + 10);
    setNum2(Math.floor(Math.random() * 40) + 10);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    captcha: ""
  });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [alertMsg, setAlertMsg] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setAlertMsg("");

    const { name, email, subject, message, captcha } = formData;

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus("error");
      setAlertMsg("Please fill in all the fields.");
      return;
    }

    const expectedAnswer = num1 + num2;
    if (parseInt(captcha.trim(), 10) !== expectedAnswer) {
      setStatus("error");
      setAlertMsg(`Incorrect answer. Please enter the correct sum of ${num1} + ${num2}.`);
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

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setStatus("idle");
          setAlertMsg("");
        }, 5000);
      } else {
        const data = await res.json();
        setStatus("error");
        setAlertMsg(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setAlertMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="bwp-footer-widgets-section" role="complementary">
      <h2 className="screen-reader-text">{" Widgets "}</h2>
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <div className="row">
        <div id="about-us" className="col-md-4">
          <div className="bwp-footer-widgets-col-1 bwp-sidebar-content bwp-content">
            <div
              id="orin_popular_widget-3"
              className="bwp-widget widget_bwp_popular_posts clearfix"
            >
              <h3 className="bwp-widget-title">{"Popular posts"}</h3>
              <WidgetPostList posts={popularPosts} numbered />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bwp-footer-widgets-col-2 bwp-sidebar-content bwp-content">
            <div
              id="orin_random_widget-4"
              className="bwp-widget widget_bwp_random_posts clearfix"
            >
              <h3 className="bwp-widget-title">{"Random posts"}</h3>
              <WidgetPostList posts={randomPosts} />
            </div>
          </div>
        </div>
        <div id="contact-us" className="col-md-4">
          <div className="bwp-footer-widgets-col-3 bwp-sidebar-content bwp-content">
            <div id="text-2" className="bwp-widget widget_text clearfix">
              <h3 className="bwp-widget-title">{"Contact Me"}</h3>
              <div className="textwidget">
                <div
                  className="wpcf7 no-js"
                  id="wpcf7-f368-o1"
                  lang="en-US"
                  dir="ltr"
                  data-wpcf7-id="368"
                >
                  <div className="screen-reader-response">
                    <p role="status" aria-live="polite" aria-atomic="true"></p>
                    <ul></ul>
                  </div>
                  <form
                    onSubmit={handleSubmit}
                    className="wpcf7-form init"
                    aria-label="Contact form"
                    noValidate
                    data-status="init"
                  >
                    <p>
                      <label>
                        {" Your Name"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-name">
                          <input
                            size="40"
                            maxLength="400"
                            className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required"
                            aria-required="true"
                            aria-invalid="false"
                            value={formData.name}
                            onChange={handleInputChange}
                            type="text"
                            name="name"
                            required
                          />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Your Email"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-email">
                          <input
                            size="40"
                            maxLength="400"
                            className="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email"
                            aria-required="true"
                            aria-invalid="false"
                            value={formData.email}
                            onChange={handleInputChange}
                            type="email"
                            name="email"
                            required
                          />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Subject"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-subject">
                          <input
                            size="40"
                            maxLength="400"
                            className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required"
                            aria-required="true"
                            aria-invalid="false"
                            value={formData.subject}
                            onChange={handleInputChange}
                            type="text"
                            name="subject"
                            required
                          />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Your Message"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-message">
                          <textarea
                            cols="40"
                            rows="10"
                            maxLength="2000"
                            className="wpcf7-form-control wpcf7-textarea wpcf7-validates-as-required bwp-demo-contact-msg"
                            aria-required="true"
                            aria-invalid="false"
                            value={formData.message}
                            onChange={handleInputChange}
                            name="message"
                            required
                          ></textarea>
                        </span>
                      </label>
                    </p>
                    <p>
                      <span className="wpcf7-form-control-wrap" data-name="quiz-849">
                        <label>
                          <span className="wpcf7-quiz-label">
                            Please Enter Your Answer: {num1}+{num2}=?
                          </span>
                          <input
                            size="40"
                            className="wpcf7-form-control wpcf7-quiz"
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid="false"
                            type="text"
                            name="captcha"
                            value={formData.captcha}
                            onChange={handleInputChange}
                            required
                          />
                        </label>
                      </span>
                    </p>
                    <p>
                      <input
                        className="wpcf7-form-control wpcf7-submit has-spinner"
                        type="submit"
                        value={status === "submitting" ? "Sending..." : "Send Message"}
                        disabled={status === "submitting"}
                      />
                    </p>
                    {alertMsg && (
                      <div className="wpcf7-response-output" aria-hidden="true" style={{
                        display: "block",
                        padding: "10px",
                        marginTop: "15px",
                        fontSize: "12px",
                        borderRadius: "4px",
                        border: status === "success" ? "1px solid #10b981" : "1px solid #f1747b",
                        color: status === "success" ? "#10b981" : "#f1747b",
                        backgroundColor: status === "success" ? "rgba(16, 185, 129, 0.05)" : "rgba(241, 116, 123, 0.05)"
                      }}>
                        {alertMsg}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
    </section>
  );
}
