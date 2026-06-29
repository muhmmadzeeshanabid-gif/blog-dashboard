"use client";

import useScrollTop from "./useScrollTop";

export default function ScrollTop() {
  useScrollTop();

  return (
    <div id="bwp-scroll-top">
      <button type="button" className="bwp-button bwp-scroll-top-button">
        <i className="fas fa-chevron-up"></i>
      </button>
    </div>
  );
}
