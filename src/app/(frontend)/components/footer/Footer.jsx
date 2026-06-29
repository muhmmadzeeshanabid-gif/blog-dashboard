import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer className="bwp-site-footer bwp-footer-has-widgets">
        <div className="bwp-footer-text">
          <span className="bwp-demo-footer-mainline">
            {"Thanks for the visit"}
            <span className="bwp-demo-footer-heart">
              <i className="far fa-heart"></i>
            </span>
            <strong>{"Orin"}</strong>
            {" WordPress Theme © 2026"}
          </span>
          <span className="bwp-demo-footer-social-line">
            {"/ Follow:"}
            <a href="#" className="bwp-demo-footer-follow" title="X (Twitter)">
              <i className="fab fa-x-twitter"></i>
            </a>
            <a href="#" className="bwp-demo-footer-follow" title="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="bwp-demo-footer-follow" title="Pinterest">
              <i className="fab fa-pinterest-p"></i>
            </a>
            <a href="#" className="bwp-demo-footer-follow" title="Reddit">
              <i className="fab fa-reddit-alien"></i>
            </a>
          </span>
        </div>

        <div className="bwp-footer-menu">
          <nav className="menu-demo-footer-container">
            <ul id="menu-demo-footer" className="bwp-footer-menu-list list-unstyled">
              <li
                id="menu-item-347"
                className="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-347"
              >
                <Link href="/" aria-current="page">
                  {"Homepage"}
                </Link>
              </li>

              <li id="menu-item-350" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-350">
                <Link href="/about-us">{"About Us"}</Link>
              </li>
              <li id="menu-item-351" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-351">
                <Link href="/contact-us">{"Contact Us"}</Link>
              </li>
              <li id="menu-item-352" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-352">
                <Link href="/privacy-policy">{"Privacy Policy"}</Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
