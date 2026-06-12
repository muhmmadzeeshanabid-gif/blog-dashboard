"use client";

import Link from "next/link";
import useHeaderUi from "./useHeaderUi";

export default function Header() {
  useHeaderUi();

  return (
    <>
    <header id="bwp-header">
      <div className="container">
        <div className="bwp-header-container clearfix">
          <div className="bwp-header-menu">
            <nav className="menu-demo-header-container">
              <ul id="menu-demo-header" className="sf-menu sf-arrows">
                <li id="menu-item-243" className="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-243">
                  <Link href="/" aria-current="page">
                    {"Homepage"}
                  </Link>
                </li>
                <li id="menu-item-244" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-244">
                  <a href="#" className="sf-with-ul">
                    {"Categories"}
                  </a>
                  <ul className="sub-menu">
                    <li id="menu-item-246" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-246">
                      <Link href="/">
                        {"Archive By Day"}
                      </Link>
                    </li>
                    <li id="menu-item-308" className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-308">
                      <Link href="/">
                        {"Category Page"}
                      </Link>
                    </li>
                    <li id="menu-item-307" className="menu-item menu-item-type-taxonomy menu-item-object-post_tag menu-item-307">
                      <Link href="/">
                        {"Tag Page"}
                      </Link>
                    </li>
                    <li id="menu-item-309" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-309">
                      <Link href="/">
                        {"Author Page"}
                      </Link>
                    </li>
                    <li id="menu-item-257" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-257">
                      <Link href="/">
                        {"Search Results"}
                      </Link>
                    </li>
                  </ul>
                </li>
                <li id="menu-item-251" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-251">
                  <a href="#" className="sf-with-ul">
                    {"Single Posts"}
                  </a>
                  <ul className="sub-menu">
                    <li id="menu-item-258" className="menu-item menu-item-type-post_type menu-item-object-post menu-item-258">
                      <Link href="/">
                        {"Image Post"}
                      </Link>
                    </li>
                    <li id="menu-item-259" className="menu-item menu-item-type-post_type menu-item-object-post menu-item-259">
                      <Link href="/">
                        {"Gallery Post"}
                      </Link>
                    </li>
                    <li id="menu-item-261" className="menu-item menu-item-type-post_type menu-item-object-post menu-item-261">
                      <Link href="/">
                        {"Video Post"}
                      </Link>
                    </li>
                    <li id="menu-item-260" className="menu-item menu-item-type-post_type menu-item-object-post menu-item-260">
                      <Link href="/">
                        {"Audio Post"}
                      </Link>
                    </li>
                  </ul>
                </li>
                <li id="menu-item-268" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-268">
                  <a href="#about-us">
                    {"About Us"}
                  </a>
                </li>
                <li id="menu-item-271" className="menu-item menu-item-type-custom menu-item-object-custom menu-item-271">
                  <a href="#contact-us">
                    {"Contact Us"}
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="bwp-header-mobile-menu">
            <button type="button" id="bwp-toggle-mobile-menu" className="bwp-button">
              <i className="fas fa-bars"></i>
              <span className="bwp-button-text">
                {"Menu"}
              </span>
            </button>
            <div id="bwp-dropdown-mobile-menu" className="bwp-hidden">
              <nav className="menu-demo-header-container">
                <ul id="menu-demo-header-1" className="bwp-mobile-menu list-unstyled">
                  <li className="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-243">
                    <Link href="/" aria-current="page">
                      {"Homepage"}
                    </Link>
                  </li>
                  <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-244">
                    <a href="#">
                      {"Categories"}
                    </a>
                    <ul className="sub-menu">
                      <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-246">
                        <Link href="/">
                          {"Archive By Day"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-308">
                        <Link href="/">
                          {"Category Page"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-taxonomy menu-item-object-post_tag menu-item-307">
                        <Link href="/">
                          {"Tag Page"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-309">
                        <Link href="/">
                          {"Author Page"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-257">
                        <Link href="/">
                          {"Search Results"}
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-251">
                    <a href="#">
                      {"Single Posts"}
                    </a>
                    <ul className="sub-menu">
                      <li className="menu-item menu-item-type-post_type menu-item-object-post menu-item-258">
                        <Link href="/">
                          {"Image Post"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-post_type menu-item-object-post menu-item-259">
                        <Link href="/">
                          {"Gallery Post"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-post_type menu-item-object-post menu-item-261">
                        <Link href="/">
                          {"Video Post"}
                        </Link>
                      </li>
                      <li className="menu-item menu-item-type-post_type menu-item-object-post menu-item-260">
                        <Link href="/">
                          {"Audio Post"}
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-268">
                    <a href="#about-us">
                      {"About Us"}
                    </a>
                  </li>
                  <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-271">
                    <a href="#contact-us">
                      {"Contact Us"}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          <div className="bwp-header-icons clearfix">
            <Link href="/dashboard" className="bwp-dashboard-btn" title="Dashboard">
              {"Dashboard"}
            </Link>
            <div className="bwp-header-search">
              <button type="button" id="bwp-toggle-dropdown-search" className="bwp-button">
                <i className="fas fa-search"></i>
              </button>
              <div id="bwp-dropdown-search" className="bwp-hidden">
                <form id="searchform" role="search" method="get" action="#">
                  <div className="input-group">
                    <input type="text" name="s" id="s" className="bwp-search-field form-control" autoComplete="off" placeholder="Enter your search query..." />
                    <span className="input-group-btn">
                      <button type="submit" className="btn bwp-search-submit">
                        <i className="fas fa-search"></i>
                      </button>
                    </span>
                  </div>
                </form>
              </div>
            </div>
            <button type="button" id="bwp-toggle-color" className="bwp-button">
              <i className="fas fa-sun"></i>
            </button>
            <div className="bwp-font-types">
              <button type="button" id="bwp-show-font-types" className="bwp-button">
                <i className="fas fa-font"></i>
              </button>
              <div id="bwp-dropdown-font-types" className="bwp-hidden">
                <div className="bwp-font-type bwp-active" data-font-type="sans-serif">
                  {" Sans-serif fonts "}
                </div>
                <div className="bwp-font-type" data-font-type="serif">
                  {" Serif fonts "}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
