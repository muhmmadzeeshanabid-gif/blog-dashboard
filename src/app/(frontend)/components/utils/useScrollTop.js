"use client";

import { useEffect } from "react";

export default function useScrollTop() {
  useEffect(() => {
    const scrollRoot = document.getElementById("bwp-scroll-top");
    const button = scrollRoot?.querySelector("button");

    if (!scrollRoot || !button) {
      return undefined;
    }

    const onScroll = () => {
      scrollRoot.classList.toggle("bwp-visible", window.scrollY > 500);
    };

    const onClick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    button.addEventListener("click", onClick);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      button.removeEventListener("click", onClick);
    };
  }, []);
}
