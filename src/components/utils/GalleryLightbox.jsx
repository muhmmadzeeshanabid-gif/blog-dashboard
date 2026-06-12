"use client";

import { useEffect, useState } from "react";

export default function GalleryLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const isSingleImage = anchor.classList.contains("bwp-popup-image");
      const isGalleryItem = anchor.classList.contains("bwp-popup-gallery-item");

      if (!isSingleImage && !isGalleryItem) return;

      e.preventDefault();

      let items = [];
      let initialIndex = 0;

      if (isGalleryItem) {
        const gallery = anchor.closest(".bwp-popup-gallery");
        if (gallery) {
          const itemElements = Array.from(
            gallery.querySelectorAll("a.bwp-popup-gallery-item")
          );
          items = itemElements.map((el) => ({
            src: el.getAttribute("href"),
            title: el.getAttribute("title") || "",
          }));
          initialIndex = itemElements.indexOf(anchor);
        }
      } else if (isSingleImage) {
        const itemElements = Array.from(
          document.querySelectorAll("a.bwp-popup-image")
        );
        items = itemElements.map((el) => ({
          src: el.getAttribute("href"),
          title: el.getAttribute("title") || "",
        }));
        initialIndex = itemElements.indexOf(anchor);
      }

      if (items.length > 0) {
        setImages(items);
        setCurrentIdx(initialIndex);
        setIsOpen(true);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Keyboard navigation and body style lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowRight") {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      }
      if (e.key === "ArrowLeft") {
        setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("mfp-zoom-out-cur");

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.documentElement.classList.remove("mfp-zoom-out-cur");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIdx];
  const titleParts = currentImage.title.split("*");
  const mainTitle = titleParts[0].trim();
  const captionText = titleParts[1] ? titleParts[1].trim() : "";

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="mfp-bg mfp-ready" 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Main Wrap Container */}
      <div 
        className="mfp-wrap mfp-close-btn-in mfp-auto-cursor mfp-ready" 
        tabIndex={-1} 
        style={{ overflow: "hidden auto" }}
        onClick={() => setIsOpen(false)}
      >
        <div className="mfp-container mfp-image-holder mfp-s-ready">
          <div 
            className="mfp-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mfp-figure">
              {/* Close Button */}
              <button 
                title="Close (Esc)" 
                type="button" 
                className="mfp-close"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
              
              <figure>
                {/* Main Image */}
                <img 
                  className="mfp-img animate-zoom-in" 
                  src={currentImage.src} 
                  alt={mainTitle}
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                />
                
                {/* Bottom Bar Info */}
                <figcaption>
                  <div className="mfp-bottom-bar">
                    <div className="mfp-title">
                      <strong>{mainTitle}</strong>
                      {captionText && <small>{captionText}</small>}
                    </div>
                    <div className="mfp-counter">
                      {`${currentIdx + 1} of ${images.length}`}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button 
                title="Previous (Left arrow key)" 
                type="button" 
                className="mfp-arrow mfp-arrow-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
                }}
              ></button>
              <button 
                title="Next (Right arrow key)" 
                type="button" 
                className="mfp-arrow mfp-arrow-right"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx((prev) => (prev + 1) % images.length);
                }}
              ></button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
