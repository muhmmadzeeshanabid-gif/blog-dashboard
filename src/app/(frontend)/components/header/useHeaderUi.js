"use client";

import { useEffect } from "react";

function setThemeCookie(isDark) {
  document.cookie = `orin_site_style=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
}

export default function useHeaderUi(categories) {
  useEffect(() => {
    const mobileToggle = document.getElementById("bwp-toggle-mobile-menu");
    const mobileDropdown = document.getElementById("bwp-dropdown-mobile-menu");
    const colorToggle = document.getElementById("bwp-toggle-color");

    if (!mobileToggle || !mobileDropdown || !colorToggle) {
      return undefined;
    }

    const body = document.body;
    const mobileToggleIcon = mobileToggle.querySelector("i");
    const mobileToggleText = mobileToggle.querySelector(".bwp-button-text");

    const setMobileToggleState = (isOpen) => {
      if (mobileToggleIcon) {
        mobileToggleIcon.className = isOpen ? "fas fa-times" : "fas fa-bars";
      }

      if (mobileToggleText) {
        mobileToggleText.textContent = isOpen ? "Close" : "Menu";
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

      link.addEventListener("click", onClick);
      mobileSubmenuButtons.push({ button, link, submenu, onClick, menuItem });
    });

    const onMobileToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (mobileDropdown.classList.contains("bwp-visible")) {
        closeMobileMenu();
        return;
      }

      // Close React search if open by triggering standard event
      window.dispatchEvent(new CustomEvent("orin-close-search"));
      openMobileMenu();
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
    };

    mobileToggle.addEventListener("click", onMobileToggle);
    colorToggle.addEventListener("click", onColorToggle);
    document.addEventListener("click", onDocumentClick);

    return () => {
      mobileToggle.removeEventListener("click", onMobileToggle);
      colorToggle.removeEventListener("click", onColorToggle);
      document.removeEventListener("click", onDocumentClick);

      mobileSubmenuButtons.forEach(({ button, link, submenu, onClick, menuItem }) => {
        link.removeEventListener("click", onClick);
        button.remove();
        submenu.style.display = "";
        menuItem.classList.remove("bwp-submenu-visible");
      });
    };
  }, [categories]);
}
