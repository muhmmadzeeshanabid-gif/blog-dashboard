import Link from "next/link";
import Image from "next/image";

function WidgetPostList({ posts = [], numbered = false }) {
  return (
    <ul className="list-unstyled">
      {posts.map((post, index) => (
        <li key={post.id}>
          <figure className="widget_bwp_thumbnail">
            <Link href={post.permalink}>
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
            <span className="widget_bwp_popular_post_num">
              {` ${index + 1} `}
            </span>
          )}
          <div className="widget_bwp_content">
            <h4 className="entry-title">
              <Link href={post.permalink}>
                {post.title}
              </Link>
            </h4>
            <ul className="widget_bwp_meta list-unstyled clearfix">
              <li>
                <Link href={post.permalink}>
                  <span className="date updated">
                    {post.dateLabel}
                  </span>
                </Link>
              </li>
              {numbered ? (
                <>
                  <li className="widget_bwp_views_count">
                    <Link href={post.permalink}>
                      {` Views: ${post.viewsLabel} `}
                    </Link>
                  </li>
                  <li className="widget_bwp_comments_count">
                    <Link href={post.permalink}>
                      {` ${post.commentsLabel} `}
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link href={post.permalink} rel="author">
                    <span className="vcard author">
                      <span className="fn">
                        {post.author}
                      </span>
                    </span>
                  </Link>
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
  return (
    <>
    <section className="bwp-footer-widgets-section" role="complementary">
      <h2 className="screen-reader-text">
        {" Widgets "}
      </h2>
      <div className="bwp-separator bwp-gradient">
        <span className="bwp-rhomb"></span>
      </div>
      <div className="row">
        <div id="about-us" className="col-md-4">
          <div className="bwp-footer-widgets-col-1 bwp-sidebar-content bwp-content">
            <div id="orin_popular_widget-3" className="bwp-widget widget_bwp_popular_posts clearfix">
              <h3 className="bwp-widget-title">
                {"Popular posts"}
              </h3>
              <WidgetPostList posts={popularPosts} numbered />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bwp-footer-widgets-col-2 bwp-sidebar-content bwp-content">
            <div id="orin_random_widget-4" className="bwp-widget widget_bwp_random_posts clearfix">
              <h3 className="bwp-widget-title">
                {"Random posts"}
              </h3>
              <WidgetPostList posts={randomPosts} />
            </div>
          </div>
        </div>
        <div id="contact-us" className="col-md-4">
          <div className="bwp-footer-widgets-col-3 bwp-sidebar-content bwp-content">
            <div id="text-2" className="bwp-widget widget_text clearfix">
              <h3 className="bwp-widget-title">
                {"Contact Me"}
              </h3>
              <div className="textwidget">
                <div className="wpcf7 no-js" id="wpcf7-f368-o1" lang="en-US" dir="ltr" data-wpcf7-id="368">
                  <div className="screen-reader-response">
                    <p role="status" aria-live="polite" aria-atomic="true"></p>
                    <ul></ul>
                  </div>
                  <form action="#contact-us" method="post" className="wpcf7-form init" aria-label="Contact form" noValidate data-status="init">
                    <div style={{ display: "none" }}>
                      <input type="hidden" name="_wpcf7" value="368" />
                      <input type="hidden" name="_wpcf7_version" value="6.1.4" />
                      <input type="hidden" name="_wpcf7_locale" value="en_US" />
                      <input type="hidden" name="_wpcf7_unit_tag" value="wpcf7-f368-o1" />
                      <input type="hidden" name="_wpcf7_container_post" value="0" />
                      <input type="hidden" name="_wpcf7_posted_data_hash" value="" />
                    </div>
                    <p>
                      <label>
                        {" Your Name"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-name">
                          <input size="40" maxLength="400" className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required" aria-required="true" aria-invalid="false" defaultValue="" type="text" name="your-name" />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Your Email"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-email">
                          <input size="40" maxLength="400" className="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email" aria-required="true" aria-invalid="false" defaultValue="" type="email" name="your-email" />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Subject"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-subject">
                          <input size="40" maxLength="400" className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required" aria-required="true" aria-invalid="false" defaultValue="" type="text" name="your-subject" />
                        </span>
                      </label>
                    </p>
                    <p>
                      <label>
                        {" Your Message"}
                        <br />
                        <span className="wpcf7-form-control-wrap" data-name="your-message">
                          <textarea cols="40" rows="10" maxLength="2000" className="wpcf7-form-control wpcf7-textarea wpcf7-validates-as-required bwp-demo-contact-msg" aria-required="true" aria-invalid="false" name="your-message"></textarea>
                        </span>
                      </label>
                    </p>
                    <p>
                      <span className="wpcf7-form-control-wrap" data-name="quiz-849">
                        <label>
                          <span className="wpcf7-quiz-label">
                            {"Please Enter Your Answer: 39+46=?"}
                          </span>
                          <input size="40" className="wpcf7-form-control wpcf7-quiz" autoComplete="off" aria-required="true" aria-invalid="false" type="text" name="quiz-849" />
                        </label>
                        <input type="hidden" name="_wpcf7_quiz_answer_quiz-849" value="24e9bcc16742d711048c3cf312980b10" />
                      </span>
                    </p>
                    <p>
                      <input className="wpcf7-form-control wpcf7-submit has-spinner" type="submit" value="Send Message" />
                    </p>
                    <div className="wpcf7-response-output" aria-hidden="true"></div>
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
    </>
  );
}
