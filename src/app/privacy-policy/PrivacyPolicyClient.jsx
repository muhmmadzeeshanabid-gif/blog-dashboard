"use client";

import Link from "next/link";
import styles from "./privacy.module.css";

const PRIVACY_ITEMS = [
  {
    icon: "fas fa-shield-alt",
    title: "1. Information We Collect",
    text: "We collect information you provide directly to us, such as your name and email address when you subscribe to our newsletter, comment on a post, or contact us through a form."
  },
  {
    icon: "far fa-user",
    title: "2. How We Use Your Information",
    text: "We use the information we collect to provide, maintain, and improve our services, communicate with you, and personalize your experience on ORIN."
  },
  {
    icon: "fas fa-cookie",
    title: "3. Cookies and Tracking Technologies",
    text: "We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from."
  },
  {
    icon: "fas fa-shield-alt",
    title: "4. Data Security",
    text: "We take reasonable measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction."
  },
  {
    icon: "fas fa-share-alt",
    title: "5. Third-Party Services",
    text: "We may use third-party services (such as analytics or email marketing tools) that may collect, monitor, and analyze information. These services have their own privacy policies."
  },
  {
    icon: "far fa-trash-alt",
    title: "6. Your Rights",
    text: "You have the right to access, update, or delete your personal information. You can also opt out of receiving marketing emails at any time."
  },
  {
    icon: "far fa-envelope",
    title: "7. Changes to This Policy",
    text: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated revision date."
  },
  {
    icon: "far fa-question-circle",
    title: "8. Contact Us",
    text: "If you have any questions about this Privacy Policy, please contact us at hello@orin.com."
  }
];

export default function PrivacyPolicyClient() {
  return (
    <section className={styles.privacySection}>
      <div className={styles.privacyHeader}>
        <h1 className={styles.privacyTitle}>Privacy Policy</h1>
        <p className={styles.privacySubtitle}>
          Your privacy is important to us. This Privacy Policy explains how ORIN collects, uses, and protects your information.
        </p>
        <div className={styles.titleSeparator}></div>
        <p className={styles.lastUpdated}>Last Updated: June 12, 2025</p>
      </div>

      <div className={styles.itemsList}>
        {PRIVACY_ITEMS.map((item, index) => (
          <div key={index} className={styles.privacyItem}>
            <div className={styles.iconContainer}>
              <i className={item.icon}></i>
            </div>
            <div className={styles.itemContent}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemText}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.calloutCard}>
        <div className={styles.calloutLeft}>
          <div className={styles.calloutIconContainer}>
            <i className="fas fa-lock"></i>
          </div>
          <div className={styles.calloutTextContent}>
            <h4 className={styles.calloutTitle}>Your Privacy Matters</h4>
            <p className={styles.calloutText}>
              We are committed to protecting your data and being transparent about how it's used.
            </p>
          </div>
        </div>
        <div className={styles.calloutRight}>
          <Link href="/contact-us" className={styles.contactButton}>
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
