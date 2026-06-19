import Link from "next/link";
import BlogPageLayout from "../layout/BlogPageLayout";
import PostGallerySlider from "./PostGallerySlider";
import PostComments from "./PostComments";
import PostVideoPlayer from "./PostVideoPlayer";
import PostAudioPlayer from "./PostAudioPlayer";
import PostShareList from "./PostShareList";
import FooterWidgets from "../widgets/FooterWidgets";
import ViewTracker from "./ViewTracker";
import ReadTimeTracker from "./ReadTimeTracker";

function formatLongDate(date) {
  if (!date) return "";
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
    commentsLabel: post.comments === 0 ? "No comments" : `${post.comments} Comments`,
    author: post.author,
  };
}

function isDirectAudioFile(url) {
  return /\.(mp3|wav|ogg|m4a|weba|webm|aac|flac)(\?.*)?$/i.test(String(url ?? ""));
}

function getAudioEmbedSource(url) {
  const rawUrl = String(url ?? "").trim();

  if (!rawUrl || isDirectAudioFile(rawUrl)) {
    return rawUrl;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    const isSoundCloudWidget =
      parsedUrl.hostname.includes("w.soundcloud.com") && parsedUrl.pathname.includes("/player");
    const isSoundCloudTrack =
      parsedUrl.hostname.includes("soundcloud.com") && !parsedUrl.hostname.includes("w.soundcloud.com");

    if (isSoundCloudWidget) {
      parsedUrl.searchParams.set("visual", "true");
      parsedUrl.searchParams.set("show_comments", "false");
      parsedUrl.searchParams.set("show_artwork", "true");
      parsedUrl.searchParams.set("maxheight", "1000");
      parsedUrl.searchParams.set("maxwidth", "1000");
      return parsedUrl.toString();
    }

    if (isSoundCloudTrack) {
      const widgetUrl = new URL("https://w.soundcloud.com/player/");
      widgetUrl.searchParams.set("visual", "true");
      widgetUrl.searchParams.set("show_comments", "false");
      widgetUrl.searchParams.set("url", rawUrl);
      widgetUrl.searchParams.set("show_artwork", "true");
      widgetUrl.searchParams.set("maxheight", "1000");
      widgetUrl.searchParams.set("maxwidth", "1000");
      return widgetUrl.toString();
    }
  } catch {
    return rawUrl;
  }

  return rawUrl;
}

function isTallAudioEmbed(url) {
  const embedSource = getAudioEmbedSource(url);
  return embedSource.includes("w.soundcloud.com/player") && embedSource.includes("visual=true");
}

function renderFormattedContent(content) {
  if (!content) return [];

  let keyCounter = 0;

  function parseInlineFormatting(text) {
    if (typeof text !== "string") return text;
    if (!text) return [];

    // Link: [label](https://example.com)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/;
    const linkMatch = text.match(linkRegex);
    if (linkMatch) {
      const before = text.substring(0, linkMatch.index);
      const label = linkMatch[1];
      const href = linkMatch[2];
      const after = text.substring(linkMatch.index + linkMatch[0].length);
      const keyId = ++keyCounter;
      return [
        ...parseInlineFormatting(before),
        <a key={`a-${keyId}`} href={href} target="_blank" rel="noreferrer">
          {parseInlineFormatting(label)}
        </a>,
        ...parseInlineFormatting(after)
      ];
    }

    // Bold: **...**
    const boldRegex = /\*\*(.*?)\*\*/;
    const boldMatch = text.match(boldRegex);
    if (boldMatch) {
      const before = text.substring(0, boldMatch.index);
      const inside = boldMatch[1];
      const after = text.substring(boldMatch.index + boldMatch[0].length);
      const keyId = ++keyCounter;
      return [
        ...parseInlineFormatting(before),
        <strong key={`b-${keyId}`}>{parseInlineFormatting(inside)}</strong>,
        ...parseInlineFormatting(after)
      ];
    }

    // Underline: <u>...</u>
    const underlineRegex = /<u>(.*?)<\/u>/;
    const underlineMatch = text.match(underlineRegex);
    if (underlineMatch) {
      const before = text.substring(0, underlineMatch.index);
      const inside = underlineMatch[1];
      const after = text.substring(underlineMatch.index + underlineMatch[0].length);
      const keyId = ++keyCounter;
      return [
        ...parseInlineFormatting(before),
        <u key={`u-${keyId}`}>{parseInlineFormatting(inside)}</u>,
        ...parseInlineFormatting(after)
      ];
    }

    // Italic: *...*
    const italicRegex = /\*(.*?)\*/;
    const italicMatch = text.match(italicRegex);
    if (italicMatch) {
      const before = text.substring(0, italicMatch.index);
      const inside = italicMatch[1];
      const after = text.substring(italicMatch.index + italicMatch[0].length);
      const keyId = ++keyCounter;
      return [
        ...parseInlineFormatting(before),
        <em key={`i-${keyId}`}>{parseInlineFormatting(inside)}</em>,
        ...parseInlineFormatting(after)
      ];
    }

    // Strikethrough: ~~...~~
    const strikeRegex = /~~(.*?)~~/;
    const strikeMatch = text.match(strikeRegex);
    if (strikeMatch) {
      const before = text.substring(0, strikeMatch.index);
      const inside = strikeMatch[1];
      const after = text.substring(strikeMatch.index + strikeMatch[0].length);
      const keyId = ++keyCounter;
      return [
        ...parseInlineFormatting(before),
        <del key={`s-${keyId}`}>{parseInlineFormatting(inside)}</del>,
        ...parseInlineFormatting(after)
      ];
    }

    return [text];
  }

  const blocks = content.split(/\r?\n\r?\n/);

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Blockquote
    if (/^>\s+/.test(trimmed)) {
      const quote = trimmed
        .split(/\r?\n/)
        .map((line) => line.replace(/^>\s?/, ""))
        .join(" ");

      return (
        <blockquote
          key={idx}
          style={{
            margin: "28px 0",
            padding: "8px 0 8px 22px",
            borderLeft: "3px solid currentColor",
            fontStyle: "italic",
            opacity: 0.86
          }}
        >
          {parseInlineFormatting(quote)}
        </blockquote>
      );
    }

    // Lists
    if (/^-\s+/.test(trimmed)) {
      return (
        <ul key={idx} style={{ margin: "0 0 22px 22px" }}>
          {trimmed.split(/\r?\n/).map((line, lineIdx) => (
            <li key={lineIdx}>{parseInlineFormatting(line.replace(/^-\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      return (
        <ol key={idx} style={{ margin: "0 0 22px 22px" }}>
          {trimmed.split(/\r?\n/).map((line, lineIdx) => (
            <li key={lineIdx}>{parseInlineFormatting(line.replace(/^\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    // Check if it's a Horizontal Rule
    if (/^(?:-{3,}|\*{3,})$/.test(trimmed)) {
      return (
        <hr
          key={idx}
          style={{
            margin: "35px 0",
            border: "none",
            borderTop: "1px solid var(--dashboard-border)",
            opacity: 0.6
          }}
        />
      );
    }

    // Check if it's a heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const parsedText = parseInlineFormatting(headingText);
      const Tag = `h${level}`;
      const headingStyles = {
        h1: { fontSize: "28px", fontWeight: "700", marginTop: "30px", marginBottom: "15px", lineHeight: "1.3", color: "inherit" },
        h2: { fontSize: "24px", fontWeight: "700", marginTop: "25px", marginBottom: "12px", lineHeight: "1.3", color: "inherit" },
        h3: { fontSize: "20px", fontWeight: "600", marginTop: "20px", marginBottom: "10px", lineHeight: "1.4", color: "inherit" },
        h4: { fontSize: "18px", fontWeight: "600", marginTop: "15px", marginBottom: "8px", lineHeight: "1.4", color: "inherit" },
        h5: { fontSize: "16px", fontWeight: "600", marginTop: "15px", marginBottom: "8px", lineHeight: "1.4", color: "inherit" },
        h6: { fontSize: "14px", fontWeight: "600", marginTop: "15px", marginBottom: "8px", lineHeight: "1.4", color: "inherit" },
      };
      return (
        <Tag key={idx} style={headingStyles[Tag] || headingStyles.h2}>
          {parsedText}
        </Tag>
      );
    }

    // Default paragraph
    return (
      <p key={idx} style={{ marginBottom: "20px" }}>
        {parseInlineFormatting(trimmed)}
      </p>
    );
  });
}

export default function PostDetailContent({
  post,
  adjacent,
  relatedPosts,
  homepageFeed,
  formatSlugs,
  authorData,
  appSettings,
  popularPosts = [],
  randomPosts = []
}) {
  const formattedDate = formatLongDate(post.publishedAtDate ?? post.updatedAtDate);

  const showSidebar = appSettings?.showSidebar !== false;
  const isLeft = appSettings?.sidebarPosition === "left";

  const mainColClass = showSidebar
    ? `col-lg-8 col-md-8 ${isLeft ? "order-md-2" : "order-md-1"}`
    : "col-lg-12 col-md-12";
  const sidebarColClass = `col-lg-4 col-md-4 ${isLeft ? "order-md-1" : "order-md-2"}`;

  return (
    <BlogPageLayout activeFormat={post.format} formatSlugs={formatSlugs} showSeparator>
      <ViewTracker slug={post.slug} />
      <ReadTimeTracker slug={post.slug} />
      <div className="bwp-single-post-container">
        <div className="row">
          <main id="bwp-main" className={`bwp-site-main ${mainColClass}`} role="main">
            <article
              id={`post-${post.id}`}
              className={`post-${post.id} post type-post status-publish format-${post.format} has-post-thumbnail hentry category-${post.category.toLowerCase().replace(/\s+/g, "-")} bwp-single-post-article`}
            >
              <div className="bwp-post-wrap">
                <header className="bwp-single-post-header">
                  <div className="bwp-post-sticky-mark bwp-hidden">
                    <i className="fas fa-thumbtack"></i>
                  </div>
                  <ul className="bwp-single-post-metadata list-unstyled">
                    <li className="bwp-author bwp-visible">
                      <Link href="#" title={`Posts by ${post.author}`} rel="author">
                        {post.author}
                      </Link>
                    </li>
                    <li className="bwp-date bwp-visible">
                      <Link href="#" title={formattedDate}>
                        <span className="date updated">{formattedDate}</span>
                      </Link>
                    </li>
                    <li className="bwp-categories bwp-visible">
                      <Link href={`/categories/${post.category.toLowerCase()}`} title={post.category}>
                        {post.category}
                      </Link>
                    </li>
                  </ul>
                  <h1 className="bwp-post-title">{post.title}</h1>
                  <span className="bwp-single-post-header-separator"></span>
                </header>

                {/* Post Media rendering based on post format */}
                {post.format === "image" && post.image && (
                  <figure className="bwp-post-media">
                    <a
                      href={post.image}
                      className="bwp-popup-image"
                      title={`${post.title} * ${post.excerpt}`}
                    >
                      <img
                        src={post.image}
                        className="attachment-full size-full wp-post-image"
                        alt={post.title}
                      />
                      <span className="bwp-post-media-overlay"></span>
                      <span className="bwp-post-hover-icon bwp-expand-image">
                        <i className="far fa-images"></i>
                      </span>
                    </a>
                  </figure>
                )}

                {post.format === "video" && post.videoUrl && (
                  <PostVideoPlayer
                    videoUrl={post.videoUrl}
                    poster={post.image}
                    title={post.title}
                    author={post.author}
                  />
                )}

                {post.format === "audio" && post.audioUrl && (
                  <>
                    {isDirectAudioFile(post.audioUrl) ? (
                      <PostAudioPlayer
                        audioUrl={post.audioUrl}
                        title={post.title}
                        author={post.author}
                        image={post.image}
                      />
                    ) : (
                      <figure className="bwp-post-media bwp-audio-player">
                        <div className="bwp-iframe-audio-wrap">
                          <iframe
                            src={getAudioEmbedSource(post.audioUrl)}
                            title={post.title}
                            allow="autoplay; encrypted-media"
                            scrolling="no"
                            frameBorder="no"
                            style={{
                              width: "100%",
                              border: "none",
                              height: isTallAudioEmbed(post.audioUrl) ? "400px" : "166px",
                              display: "block"
                            }}
                          />
                        </div>
                      </figure>
                    )}
                  </>
                )}

                {post.format === "gallery" && post.galleryImages && post.galleryImages.length > 0 && (
                  <PostGallerySlider
                    images={post.galleryImages}
                    title={post.title}
                  />
                )}

                {/* Main Content paragraphs */}
                <div className="bwp-single-post-content bwp-content">
                  {renderFormattedContent(post.content)}
                </div>

                {/* Gallery Blocks (shown for extra/additional images in database) */}
                {post.gallery && post.gallery.length > 0 && (
                  <div className="bwp-single-post-content" style={{ marginTop: "48px" }}>
                    <div
                      className="gallery gallery-columns-2"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "13px 2px",
                        margin: "0 0 24px",
                        padding: "0",
                        listStyle: "none"
                      }}
                    >
                      {post.gallery.map((item, idx) => {
                        const isLastOdd = idx === post.gallery.length - 1 && post.gallery.length % 2 !== 0;
                        return (
                          <figure
                            key={idx}
                            className="gallery-item"
                            style={{
                              flex: isLastOdd ? "1 1 100%" : "1 1 calc(50% - 1px)",
                              maxWidth: isLastOdd ? "100%" : "calc(50% - 1px)",
                              margin: "0",
                              boxSizing: "border-box"
                            }}
                          >
                            {item.image && (
                              <div className="gallery-icon">
                                <a
                                  href={item.image}
                                  className="bwp-popup-image"
                                  title={`${post.title} * Image ${idx + 1}`}
                                  style={{
                                    display: "block",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    position: "relative"
                                  }}
                                >
                                  <img
                                    src={item.image}
                                    alt={`${post.title} — image ${idx + 1}`}
                                    style={{
                                      width: "100%",
                                      height: "auto",
                                      display: "block"
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                            {item.text && (
                              <figcaption
                                className="gallery-caption"
                                style={{
                                  fontSize: "14px",
                                  fontStyle: "italic",
                                  marginTop: "8px",
                                  paddingLeft: "12px",
                                  borderLeft: "3px solid var(--user-accent, #6f6fff)",
                                  opacity: 0.85
                                }}
                              >
                                {item.text}
                              </figcaption>
                            )}
                          </figure>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tags and Social Share buttons container */}
                <div className={`${post.tags && post.tags.length > 0 ? "bwp-single-post-tags-share" : "bwp-single-post-share-container"} clearfix`} style={{ width: "100%", maxWidth: "800px", margin: "30px auto 0" }}>
                  {post.tags && post.tags.length > 0 && (
                    <div className="bwp-single-post-tags">
                      {post.tags.map((tag) => (
                        <Link key={tag} href={`/categories/${post.category.toLowerCase()}/${tag.toLowerCase()}`} rel="tag">
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="bwp-single-post-share">
                    <PostShareList />
                  </div>
                  <div className="clearfix"></div>
                </div>

              </div>
            </article>

            {/* Adjacent Post Navigation */}
            {(adjacent.prev || adjacent.next) && (
              <div className="bwp-single-post-navigation">
                <div className="bwp-separator bwp-gradient">
                  <span className="bwp-rhomb"></span>
                </div>
                <div className="bwp-single-post-navigation-container">
                  <nav className="navigation post-navigation" role="navigation" aria-label="Posts">
                    <h2 className="screen-reader-text">Post navigation</h2>
                    <div className="nav-links">
                      {adjacent.prev && (
                        <div className="nav-previous">
                          <Link href={`/posts/${adjacent.prev.slug}`} rel="prev">
                            <span className="meta-nav">
                              <i className="fas fa-arrow-left"></i>Previous Post
                            </span>
                            <span className="post-title-nav">{adjacent.prev.title}</span>
                          </Link>
                        </div>
                      )}

                      {adjacent.next && (
                        <div className="nav-next">
                          <Link href={`/posts/${adjacent.next.slug}`} rel="next">
                            <span className="meta-nav">
                              Next Post<i className="fas fa-arrow-right"></i>
                            </span>
                            <span className="post-title-nav">{adjacent.next.title}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </nav>
                </div>
              </div>
            )}

            {/* Author Info Biography Box */}
            <div className="bwp-about-author">
              <div className="bwp-separator bwp-gradient">
                <span className="bwp-rhomb"></span>
              </div>
              <div className="bwp-about-author-container clearfix">
                <div className="bwp-about-author-avatar">
                  <Link href="#" title={`Posts by ${authorData?.name || post.author}`} rel="author">
                    <img
                      alt={authorData?.name || post.author}
                      src={authorData?.avatar || "https://secure.gravatar.com/avatar/602f3bb4e42cc75168bc6a987cf48ca3?s=100&d=mm&r=g"}
                      className="avatar avatar-62 photo"
                      height="62"
                      width="62"
                      loading="lazy"
                    />
                    <span className="bwp-avatar-overlay"></span>
                  </Link>
                </div>
                <h4 className="bwp-about-author-name">
                  <Link href="#" title={`Posts by ${authorData?.name || post.author}`} rel="author">
                    {authorData?.name || post.author}
                  </Link>
                </h4>
                <div className="bwp-about-author-posts-num">
                  {`${authorData?.postsCount ?? 10} ${(authorData?.postsCount ?? 10) === 1 ? "article" : "articles"}`}
                </div>
                <div className="bwp-about-author-bio">
                  <p>{authorData?.bio || "Developer of WordPress themes and writer of minimalist stories."}</p>
                </div>
              </div>
            </div>

            {/* You May Also Like / Related Posts Section */}
            {relatedPosts.length > 0 && (
              <div className="bwp-related-posts">
                <div className="bwp-separator bwp-gradient">
                  <span className="bwp-rhomb"></span>
                </div>
                <div className="bwp-related-posts-wrap">
                  <h3 className="bwp-related-posts-title">You May Also Like</h3>
                  <div className="bwp-related-posts-list clearfix">
                    {relatedPosts.map((rPost) => (
                      <article key={rPost.id} className={`post type-post status-publish format-${rPost.format} has-post-thumbnail hentry bwp-col-3`}>
                        <div className="bwp-post-wrap">
                          {rPost.image && (
                            <figure className="bwp-post-media">
                              <Link href={`/posts/${rPost.slug}`} title={rPost.title}>
                                <img
                                  src={rPost.image}
                                  className="attachment-full size-full"
                                  alt={rPost.title}
                                  style={{
                                    width: "100%",
                                    height: "175px",
                                    objectFit: "cover",
                                    borderRadius: "2px",
                                    display: "block"
                                  }}
                                />
                                <span className="bwp-post-media-overlay"></span>
                                <span className="bwp-post-hover-icon bwp-expand-image">
                                  <i className={
                                    rPost.format === "video" ? "fas fa-video" :
                                      rPost.format === "audio" ? "fas fa-headphones-alt" :
                                        rPost.format === "gallery" ? "far fa-images" : "far fa-images"
                                  }></i>
                                </span>
                              </Link>
                            </figure>
                          )}
                          <div className="bwp-post-content">
                            <h4 className="bwp-post-title">
                              <Link href={`/posts/${rPost.slug}`} title={rPost.title}>
                                {rPost.title}
                              </Link>
                            </h4>
                            <ul className="bwp-post-metadata list-unstyled clearfix">
                              <li className="bwp-tags">
                                {rPost.tags && rPost.tags.length > 0 ? (
                                  rPost.tags.map((tag, idx) => (
                                    <span key={tag}>
                                      <Link href={`/categories/${rPost.category.toLowerCase()}/${tag.toLowerCase()}`} rel="tag">
                                        {tag}
                                      </Link>
                                      {idx < rPost.tags.length - 1 && ", "}
                                    </span>
                                  ))
                                ) : (
                                  <span>No tags</span>
                                )}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </main>

          {showSidebar && (
            <aside className={`${sidebarColClass} bwp-sidebar-content`} style={{ marginTop: "50px" }}>



            </aside>
          )}

        </div>
      </div>

      <FooterWidgets
        popularPosts={homepageFeed.popularPosts.map(mapWidgetPost)}
        randomPosts={homepageFeed.randomPosts.map(mapWidgetPost)}
      />
    </BlogPageLayout>
  );
}
