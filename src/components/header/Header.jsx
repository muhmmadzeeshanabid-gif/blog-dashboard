"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useHeaderUi from "./useHeaderUi";

export default function Header({ activeFormat = "", formatSlugs = {} }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHomepage = pathname === "/";
  const isSinglePost = pathname.startsWith("/posts/");
  const isContactPage = pathname === "/contact-us";
  const isAboutPage = pathname === "/about-us";

  const currentCategory = searchParams ? searchParams.get("category")?.toLowerCase() || "" : "";
  const currentTag = searchParams ? searchParams.get("tag")?.toLowerCase() || "" : "";
  const currentSearch = searchParams ? searchParams.get("s") || "" : "";

  const isHomepageActive = isHomepage && !currentCategory && !currentTag && !currentSearch;

  // Dynamic categories with static fallbacks to prevent hydration mismatch
  const [categories, setCategories] = useState([
    { name: "Lifestyle", subCategories: ["Happiness", "Habits", "Balance"] },
    { name: "Productivity", subCategories: ["Workflow", "Focus Tips", "Tools"] },
    { name: "Travel", subCategories: ["Nature", "National Parks", "Video"] },
    { name: "Minimalism", subCategories: ["Space Clearing", "Simple Living", "Decluttering"] },
    { name: "Wellness", subCategories: ["Mindset", "Meditation", "Balance"] }
  ]);

  const isCatActive = (cat) => {
    if (currentCategory && currentCategory === cat.name.toLowerCase()) {
      return true;
    }
    if (currentTag && cat.subCategories) {
      return cat.subCategories.some((sub) => sub.toLowerCase() === currentTag);
    }
    return false;
  };

  const isAnyCategoryActive = categories.some(isCatActive);

  useHeaderUi(categories);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load categories");
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header id="bwp-header">
        <div className="container">
          <div className="bwp-header-container clearfix">
            <div className="bwp-header-menu">
              <nav className="menu-demo-header-container">
                <ul id="menu-demo-header" className="sf-menu sf-arrows">
                  <li id="menu-item-243" className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-243 ${isHomepageActive ? "current-menu-item current_page_item" : ""}`}>
                    <Link href="/" aria-current={isHomepageActive ? "page" : undefined}>
                      {"Homepage"}
                    </Link>
                  </li>
                  <li id="menu-item-244" className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-244 ${isAnyCategoryActive ? "current-menu-ancestor current-menu-parent" : ""}`}>
                    <a href="#" className="sf-with-ul">
                      {"Categories"}
                    </a>
                    <ul className="sub-menu">
                      {categories.map((cat, idx) => {
                        const active = isCatActive(cat);
                        return (
                          <li key={cat.name} className={`menu-item ${cat.subCategories && cat.subCategories.length > 0 ? "menu-item-has-children" : ""} menu-item-cat-${idx} ${active ? "current-menu-item current_page_item" : ""}`}>
                            <Link href={`/categories/${cat.name.toLowerCase()}`} className={`${cat.subCategories && cat.subCategories.length > 0 ? "sf-with-ul" : ""} ${active ? "sf-active" : ""}`}>
                              {cat.name}
                            </Link>
                            {cat.subCategories && cat.subCategories.length > 0 && (
                              <ul className="sub-menu">
                                {cat.subCategories.map((sub) => {
                                  const isTagActive = currentTag === sub.toLowerCase();
                                  return (
                                    <li key={sub} className={isTagActive ? "current-menu-item current_page_item" : ""}>
                                      <Link href={`/categories/${cat.name.toLowerCase()}/${sub.toLowerCase()}`}>
                                        {sub}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  <li id="menu-item-268" className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-268 ${isAboutPage ? "current-menu-item current_page_item" : ""}`}>
                    <Link href="/about-us">
                      {"About Us"}
                    </Link>
                  </li>
                  <li id="menu-item-271" className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-271 ${isContactPage ? "current-menu-item current_page_item" : ""}`}>
                    <Link href="/contact-us">
                      {"Contact Us"}
                    </Link>
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
                    <li className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-243 ${isHomepageActive ? "current-menu-item current_page_item" : ""}`}>
                      <Link href="/" aria-current={isHomepageActive ? "page" : undefined}>
                        {"Homepage"}
                      </Link>
                    </li>
                    <li className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-244 ${isAnyCategoryActive ? "current-menu-ancestor current-menu-parent" : ""}`}>
                      <a href="#">
                        {"Categories"}
                      </a>
                      <ul className="sub-menu">
                        {categories.map((cat, idx) => {
                          const active = isCatActive(cat);
                          return (
                            <li key={cat.name} className={`menu-item ${cat.subCategories && cat.subCategories.length > 0 ? "menu-item-has-children" : ""} menu-item-cat-${idx} ${active ? "current-menu-item current_page_item" : ""}`}>
                              <Link href={`/categories/${cat.name.toLowerCase()}`}>
                                {cat.name}
                              </Link>
                              {cat.subCategories && cat.subCategories.length > 0 && (
                                <ul className="sub-menu">
                                  {cat.subCategories.map((sub) => {
                                    const isTagActive = currentTag === sub.toLowerCase();
                                    return (
                                      <li key={sub} className={isTagActive ? "current-menu-item current_page_item" : ""}>
                                        <Link href={`/categories/${cat.name.toLowerCase()}/${sub.toLowerCase()}`}>
                                          {sub}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                    <li className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-268 ${isAboutPage ? "current-menu-item current_page_item" : ""}`}>
                      <Link href="/about-us">
                        {"About Us"}
                      </Link>
                    </li>
                    <li className={`menu-item menu-item-type-custom menu-item-object-custom menu-item-271 ${isContactPage ? "current-menu-item current_page_item" : ""}`}>
                      <Link href="/contact-us">
                        {"Contact Us"}
                      </Link>
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
                  <form id="searchform" role="search" method="get" action="/">
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
