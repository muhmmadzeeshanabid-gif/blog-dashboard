"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useHeaderUi from "./useHeaderUi";

function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function Header({ activeFormat = "", formatSlugs = {}, initialCategories = undefined }) {
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

  const [categories, setCategories] = useState(initialCategories || []);

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

  // Search overlay and query states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Close search dropdown on global custom events
  useEffect(() => {
    const handleClose = () => setIsSearchOpen(false);
    window.addEventListener("orin-close-search", handleClose);
    return () => window.removeEventListener("orin-close-search", handleClose);
  }, []);

  // Listen to clicks outside the search container to auto-close the dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const searchContainer = document.querySelector(".bwp-header-search");
      if (searchContainer && !searchContainer.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isSearchOpen]);

  // Debounced search query lookup to search articles matching the text input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Error searching posts:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle click on search icon button to toggle dropdown visibility
  const handleSearchToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Close mobile navigation menu if it is currently open
    const mobileToggle = document.getElementById("bwp-toggle-mobile-menu");
    const mobileDropdown = document.getElementById("bwp-dropdown-mobile-menu");
    if (mobileToggle && mobileDropdown && mobileDropdown.classList.contains("bwp-visible")) {
      mobileToggle.classList.remove("bwp-active");
      mobileDropdown.classList.remove("bwp-visible");
      const icon = mobileToggle.querySelector("i");
      const text = mobileToggle.querySelector(".bwp-button-text");
      if (icon) icon.className = "fas fa-bars";
      if (text) text.textContent = "Menu";
    }

    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setTimeout(() => {
        document.getElementById("s-input-field")?.focus();
      }, 100);
    }
  };

  // Redirect to homepage search query feeds on full form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      window.location.href = `/?s=${encodeURIComponent(searchQuery)}`;
    }
  };

  useEffect(() => {
    if (initialCategories !== undefined) return;

    fetch("/api/categories")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load categories");
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, [initialCategories]);

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
                                        {toTitleCase(sub)}
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
                                          {toTitleCase(sub)}
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
                <button 
                  type="button" 
                  id="bwp-toggle-dropdown-search" 
                  className={`bwp-button ${isSearchOpen ? "bwp-active" : ""}`}
                  onClick={handleSearchToggle}
                >
                  <i className={`fas fa-${isSearchOpen ? "times" : "search"}`}></i>
                </button>
                <div id="bwp-dropdown-search" className={isSearchOpen ? "bwp-visible" : "bwp-hidden"}>
                  <form onSubmit={handleSearchSubmit} id="searchform" role="search">
                    <div className="input-group">
                      <input 
                        type="text" 
                        id="s-input-field"
                        className="bwp-search-field form-control" 
                        autoComplete="off" 
                        placeholder="Enter your search query..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="input-group-btn">
                        <button type="submit" className="btn bwp-search-submit">
                          <i className="fas fa-search"></i>
                        </button>
                      </span>
                    </div>
                  </form>

                  {(searchQuery || isLoading) && (
                    <div className="bwp-search-results-wrapper">
                      {isLoading && (
                        <div className="bwp-search-loading">
                          <i className="fas fa-spinner fa-spin"></i> Searching...
                        </div>
                      )}

                      {!isLoading && searchQuery && searchResults.length === 0 && (
                        <div className="bwp-search-no-results">
                          No posts found
                        </div>
                      )}

                      {!isLoading && searchResults.length > 0 && (
                        <div className="bwp-search-results-list">
                          {searchResults.map((post) => (
                            <Link 
                              href={`/posts/${post.slug}?search=${encodeURIComponent(searchQuery)}`} 
                              key={post.id} 
                              className="bwp-search-result-card"
                              onClick={() => setIsSearchOpen(false)}
                            >
                              <div className="bwp-search-card-img-wrap">
                                  <Image 
                                    src={post.image || "/images/placeholder-image.jpg"} 
                                    alt={post.title} 
                                    fill
                                    sizes="50px"
                                    className="bwp-search-card-img"
                                  />
                              </div>
                              <div className="bwp-search-card-details">
                                <span className="bwp-search-card-cat">{post.category}</span>
                                <h4 className="bwp-search-card-title">{post.title}</h4>
                                <span className="bwp-search-card-meta">
                                  By {post.author || "Admin"}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <style jsx global>{`
                @media (max-width: 768px) {
                  #bwp-dropdown-search {
                    position: fixed !important;
                    top: 70px !important;
                    left: 15px !important;
                    right: 15px !important;
                    width: calc(100vw - 30px) !important;
                    max-width: none !important;
                    margin-top: 0 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
                    z-index: 1001 !important;
                  }
                  #bwp-dropdown-search::before {
                    display: none !important;
                  }
                }

                .bwp-search-results-wrapper {
                  padding: 8px 4px 8px 0;
                  border-top: 1px solid #eeeff1;
                  margin-top: 8px;
                }

                .bwp-dark-style .bwp-search-results-wrapper {
                  border-top-color: rgba(255, 255, 255, 0.08);
                }

                .bwp-search-loading {
                  text-align: center;
                  padding: 14px 0;
                  color: #9898a4;
                  font-size: 12px;
                }

                .bwp-search-no-results,
                .bwp-search-placeholder-text {
                  text-align: center;
                  padding: 18px 8px;
                  color: #9898a4;
                  font-size: 12px;
                }

                .bwp-search-results-list {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                }

                .bwp-search-result-card {
                  display: grid;
                  grid-template-columns: 50px 1fr;
                  gap: 10px;
                  padding: 6px;
                  border-radius: 8px;
                  background: transparent;
                  transition: all 0.2s ease;
                  text-decoration: none !important;
                }

                .bwp-search-result-card:hover {
                  background: #f8f9fc;
                }

                .bwp-dark-style .bwp-search-result-card:hover {
                  background: rgba(255, 255, 255, 0.04);
                }

                .bwp-search-card-img-wrap {
                  position: relative;
                  width: 50px;
                  height: 40px;
                  border-radius: 4px;
                  overflow: hidden;
                  background: #eee;
                }

                .bwp-dark-style .bwp-search-card-img-wrap {
                  background: #2a2b35;
                }

                .bwp-search-card-img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .bwp-search-card-details {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  min-width: 0;
                }

                .bwp-search-card-cat {
                  font-size: 9px;
                  font-weight: 700;
                  text-transform: uppercase;
                  color: var(--user-accent, #6f6fff);
                  letter-spacing: 0.05em;
                  margin-bottom: 1px;
                  line-height: 1;
                }

                .bwp-search-card-title {
                  font-size: 12px;
                  font-weight: 600;
                  color: #202025;
                  margin: 0 0 2px;
                  line-height: 1.25;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

                .bwp-dark-style .bwp-search-card-title {
                  color: #f5f6fb;
                }

                .bwp-search-card-meta {
                  font-size: 10px;
                  color: #9898a4;
                  line-height: 1;
                }
              `}</style>
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
