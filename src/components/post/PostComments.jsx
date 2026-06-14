"use client";

import { useState, useEffect } from "react";

const DEFAULT_AVATARS = [
  "https://secure.gravatar.com/avatar/602f3bb4e42cc75168bc6a987cf48ca3?s=100&d=mm&r=g",
  "https://secure.gravatar.com/avatar/a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1?s=100&d=mm&r=g",
  "https://secure.gravatar.com/avatar/b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2?s=100&d=mm&r=g"
];

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default function PostComments({ postSlug, initialCount = 0 }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [commentText, setCommentText] = useState("");
  const [saveConsent, setSaveConsent] = useState(false);

  // Load comments from localStorage or generate defaults
  useEffect(() => {
    const storageKey = `orin_comments_${postSlug}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
        return;
      } catch (e) {
        console.error("Error parsing stored comments", e);
      }
    }

    // Generate mock comments
    const mockComments = [];
    if (initialCount > 0) {
      const texts = [
        "This article is very inspiring! It changed the way I think about my daily workspace and mindset.",
        "Beautiful writing. Simplicity is indeed the ultimate sophistication.",
        "I love the tone and the minimalist structure of these thoughts. Looking forward to more articles!",
        "Very helpful tips. I will definitely try changing my environment next time I feel stuck.",
        "The photography format fits so well with this content. Great job!",
        "Keep up the amazing work! Absolutely love this layout.",
        "Simple yet highly impactful. Reminds me to take a deep breath.",
        "Very well written. A calm environment truly does lead to a calm mind."
      ];

      const authors = ["Aiony Haust", "Florencia Potter", "Jan Pictures", "Ben Accounting", "Sarah Dorweiler", "Jocelyn Morales", "Jonny Caspari", "Diana Schroder"];

      for (let i = 0; i < Math.min(initialCount, texts.length); i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i + 1) * 3);
        mockComments.push({
          id: `mock-${i}`,
          author: authors[i % authors.length],
          email: `${authors[i % authors.length].toLowerCase().replace(" ", "")}@example.com`,
          text: texts[i % texts.length],
          date: date.toISOString(),
          avatar: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length]
        });
      }
    }
    setComments(mockComments);
  }, [postSlug, initialCount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !commentText.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      author: name,
      email: email,
      website: website,
      text: commentText,
      date: new Date().toISOString(),
      avatar: DEFAULT_AVATARS[comments.length % DEFAULT_AVATARS.length]
    };

    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem(`orin_comments_${postSlug}`, JSON.stringify(updated));

    // Clear form
    setCommentText("");
    if (!saveConsent) {
      setName("");
      setEmail("");
      setWebsite("");
    }
  };

  return (
    <div id="comments" className="bwp-comments-area">
      <div className="bwp-separator bwp-gradient"><span className="bwp-rhomb"></span></div>
      
      <h3 className="bwp-comments-title">
        {comments.length === 0
          ? "No Comments"
          : comments.length === 1
          ? "1 Comment"
          : `${comments.length} Comments`}
      </h3>

      {comments.length > 0 && (
        <div className="bwp-comment-list-wrap">
          <ol className="bwp-comment-list">
            {comments.map((comment, index) => (
              <li
                key={comment.id}
                className={`comment ${index % 2 === 0 ? "even" : "odd"} thread-${
                  index % 2 === 0 ? "even" : "odd"
                } depth-1`}
              >
                <article className="comment-body">
                  <header className="comment-meta">
                    <div className="comment-author vcard">
                      <img
                        alt={comment.author}
                        src={comment.avatar}
                        className="avatar avatar-46 photo"
                        height="46"
                        width="46"
                        loading="lazy"
                      />
                      <b className="fn">
                        {comment.website ? (
                          <a href={comment.website} target="_blank" rel="noopener noreferrer" className="url">
                            {comment.author}
                          </a>
                        ) : (
                          comment.author
                        )}
                      </b>
                    </div>

                    <div className="comment-metadata">
                      <a href={`#comment-${comment.id}`}>
                        <time dateTime={comment.date}>{formatDate(new Date(comment.date))}</time>
                      </a>
                    </div>
                  </header>

                  <div className="comment-content">
                    <p>{comment.text}</p>
                  </div>

                  <div className="reply">
                    <a
                      className="comment-reply-link"
                      href="#respond"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("comment")?.focus();
                      }}
                    >
                      Reply
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div id="respond" className="comment-respond">
        <h3 id="reply-title" className="comment-reply-title">
          Leave a Comment
        </h3>
        <form onSubmit={handleSubmit} id="commentform" className="comment-form" noValidate>
          <p className="comment-notes">
            <span id="email-notes">Your email address will not be published.</span> Required fields are marked{" "}
            <span className="required">*</span>
          </p>
          <p className="comment-form-comment">
            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              name="comment"
              cols="45"
              rows="8"
              maxLength={65525}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            ></textarea>
          </p>
          <p className="comment-form-author">
            <label htmlFor="author">
              Name <span className="required">*</span>
            </label>
            <input
              id="author"
              name="author"
              type="text"
              size="30"
              maxLength={245}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </p>
          <p className="comment-form-email">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              size="30"
              maxLength={100}
              aria-describedby="email-notes"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </p>
          <p className="comment-form-url">
            <label htmlFor="url">Website</label>
            <input
              id="url"
              name="url"
              type="url"
              size="30"
              maxLength={200}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </p>
          <p className="comment-form-cookies-consent">
            <input
              id="wp-comment-cookies-consent"
              name="wp-comment-cookies-consent"
              type="checkbox"
              value="yes"
              checked={saveConsent}
              onChange={(e) => setSaveConsent(e.target.checked)}
            />{" "}
            <label htmlFor="wp-comment-cookies-consent">
              Save my name, email, and website in this browser for the next time I comment.
            </label>
          </p>
          <p className="form-submit">
            <input name="submit" type="submit" id="submit" className="submit" value="Post Comment" />
          </p>
        </form>
      </div>
    </div>
  );
}
