"use client";

import { useEffect } from "react";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function useHeaderUi(categories) {
  useEffect(() => {
    const mobileToggle = document.getElementById("bwp-toggle-mobile-menu");
    const mobileDropdown = document.getElementById("bwp-dropdown-mobile-menu");
    const searchToggle = document.getElementById("bwp-toggle-dropdown-search");
    const searchDropdown = document.getElementById("bwp-dropdown-search");
    const colorToggle = document.getElementById("bwp-toggle-color");

    if (!mobileToggle || !mobileDropdown || !searchToggle || !searchDropdown || !colorToggle) {
      return undefined;
    }

    const body = document.body;
    const mobileToggleIcon = mobileToggle.querySelector("i");
    const mobileToggleText = mobileToggle.querySelector(".bwp-button-text");
    const searchToggleIcon = searchToggle.querySelector("i");

    const setMobileToggleState = (isOpen) => {
      if (mobileToggleIcon) {
        mobileToggleIcon.className = isOpen ? "fas fa-times" : "fas fa-bars";
      }

      if (mobileToggleText) {
        mobileToggleText.textContent = isOpen ? "Close" : "Menu";
      }
    };

    const setSearchToggleState = (isOpen) => {
      if (searchToggleIcon) {
        searchToggleIcon.className = isOpen ? "fas fa-times" : "fas fa-search";
      }
    };

    const closeMobileMenu = () => {
      mobileToggle.classList.remove("bwp-active");
      mobileDropdown.classList.remove("bwp-visible");
      setMobileToggleState(false);
    };

    const openMobileMenu = () => {
      mobileToggle.classList.add("bwp-active");
      mobileDropdown.classList.add("bwp-visible");
      setMobileToggleState(true);
    };

    const closeSearch = () => {
      searchToggle.classList.remove("bwp-active");
      searchDropdown.classList.remove("bwp-visible");
      setSearchToggleState(false);
    };

    const openSearch = () => {
      searchToggle.classList.add("bwp-active");
      searchDropdown.classList.add("bwp-visible");
      setSearchToggleState(true);
    };

    const syncThemeIcon = () => {
      const isDark = body.classList.contains("bwp-dark-style");
      colorToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      setThemeCookie(isDark);
    };

    syncThemeIcon();

    const mobileSubmenuButtons = [];
    mobileDropdown.querySelectorAll(".menu-item-has-children").forEach((menuItem) => {
      const link = menuItem.querySelector(":scope > a");
      const submenu = menuItem.querySelector(":scope > ul");
      if (!link || !submenu) {
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "bwp-button bwp-toggle-mobile-submenu";
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<i class="fas fa-chevron-down"></i>';
      link.appendChild(button);

      const onClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const isVisible = menuItem.classList.toggle("bwp-submenu-visible");
        submenu.style.display = isVisible ? "block" : "none";
        button.setAttribute("aria-expanded", String(isVisible));
        button.innerHTML = isVisible
          ? '<i class="fas fa-chevron-up"></i>'
          : '<i class="fas fa-chevron-down"></i>';
      };

      button.addEventListener("click", onClick);
      mobileSubmenuButtons.push({ button, submenu, onClick, menuItem });
    });

    const onMobileToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (mobileDropdown.classList.contains("bwp-visible")) {
        closeMobileMenu();
        return;
      }

      closeSearch();
      openMobileMenu();
    };

    const onSearchToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (searchDropdown.classList.contains("bwp-visible")) {
        closeSearch();
        return;
      }

      closeMobileMenu();
      openSearch();
    };

    const onColorToggle = () => {
      body.classList.toggle("bwp-dark-style");
      syncThemeIcon();
    };

    const onDocumentClick = (event) => {
      if (
        !mobileDropdown.contains(event.target) &&
        !mobileToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }

      if (
        !searchDropdown.contains(event.target) &&
        !searchToggle.contains(event.target)
      ) {
        closeSearch();
      }
    };

    mobileToggle.addEventListener("click", onMobileToggle);
    searchToggle.addEventListener("click", onSearchToggle);
    colorToggle.addEventListener("click", onColorToggle);
    document.addEventListener("click", onDocumentClick);

    return () => {
      mobileToggle.removeEventListener("click", onMobileToggle);
      searchToggle.removeEventListener("click", onSearchToggle);
      colorToggle.removeEventListener("click", onColorToggle);
      document.removeEventListener("click", onDocumentClick);

      mobileSubmenuButtons.forEach(({ button, submenu, onClick, menuItem }) => {
        button.removeEventListener("click", onClick);
        button.remove();
        submenu.style.display = "";
        menuItem.classList.remove("bwp-submenu-visible");
      });
    };
  }, [categories]);
}
