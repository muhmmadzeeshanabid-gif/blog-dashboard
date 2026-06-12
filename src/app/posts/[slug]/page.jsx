import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "../../../components/footer/Footer";
import Header from "../../../components/header/Header";
import Logo from "../../../components/logo/Logo";
import FooterWidgets from "../../../components/widgets/FooterWidgets";
import ScrollTop from "../../../components/utils/ScrollTop";
import GalleryLightbox from "../../../components/utils/GalleryLightbox";
import { getHomepageFeed, getPostBySlug } from "../../../lib/postStore";
import PostViewTracker from "./PostViewTracker";
import styles from "./post.module.css";

export const dynamic = "force-dynamic";

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
    title: post.title,
    image: post.image,
    dateLabel: formatLongDate(post.publishedAtDate ?? post.updatedAtDate),
    viewsLabel: String(post.totalViews ?? 0),
    commentsLabel: post.comments === 0 ? "No comments" : `${post.comments} Comments`,
    author: post.author,
    permalink: `/posts/${post.slug}`,
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | ORIN",
    };
  }

  return {
    title: `${post.title} | ORIN`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const homepageFeed = await getHomepageFeed(1);
  const contentParagraphs = post.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <Header />

      <div className="bwp-site-content">
        <div className="container">
          <Logo />

          <section className={styles.articleWrap}>
            <Link href="/" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i>
              <span>Back To Home</span>
            </Link>

            <article className={styles.articleCard}>
              <div className={styles.mediaShell}>
                {post.format === "video" && post.videoUrl ? (
                  <iframe
                    className={styles.videoFrame}
                    src={post.videoUrl}
                    title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    priority
                    sizes="100vw"
                    className={styles.mediaImage}
                  />
                )}
              </div>

              <div className={styles.contentShell}>
                <div className={styles.metaRow}>
                  <span className={styles.categoryChip}>{post.category}</span>
                  <span className={styles.metaText}>{formatLongDate(post.publishedAtDate ?? post.updatedAtDate)}</span>
                  <span className={styles.metaText}>{post.author}</span>
                  <span className={styles.metaText}>{post.totalViews} views</span>
                </div>

                <h1 className={styles.title}>{post.title}</h1>
                <p className={styles.excerpt}>{post.excerpt}</p>

                <div className={styles.content}>
                  {contentParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {post.tags.length > 0 && (
                  <div className={styles.tags}>
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>

          <FooterWidgets
            popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
            randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
          />
        </div>
      </div>

      <Footer />

      <ScrollTop />
      <GalleryLightbox />
      <PostViewTracker slug={post.slug} />
    </>
  );
}
