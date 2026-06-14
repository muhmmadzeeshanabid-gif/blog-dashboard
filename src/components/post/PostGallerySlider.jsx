"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function PostGallerySlider({ images = [], title = "" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Measure and adjust height dynamically for vertical sliding
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      const activeSlide = containerRef.current.querySelectorAll(".bwp-post-slider-item")[activeIndex];
      if (activeSlide) {
        setHeight(activeSlide.offsetHeight || 600);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    
    // Check when images are loaded
    const imageElements = containerRef.current.querySelectorAll("img");
    imageElements.forEach(img => {
      img.addEventListener("load", updateHeight);
    });

    return () => {
      window.removeEventListener("resize", updateHeight);
      imageElements.forEach(img => {
        img.removeEventListener("load", updateHeight);
      });
    };
  }, [activeIndex, images]);

  if (images.length === 0) return null;

  const lightboxTitle = (imgSrc, idx) => `${title} * Gallery image ${idx + 1} of ${images.length}.`;

  return (
    <div className="bwp-post-media-slider bwp-popup-gallery" ref={containerRef}>
      <div 
        className="bwp-post-slider" 
        style={{ 
          position: "relative", 
          overflow: "hidden",
          height: height ? `${height}px` : "auto",
          transition: "height 350ms ease"
        }}
      >
        <div 
          ref={trackRef}
          className="bwp-post-slider-track" 
          style={{ 
            display: "flex", 
            flexDirection: "column",
            transition: "transform 550ms ease",
            transform: `translateY(-${activeIndex * (height || 0)}px)`,
            height: `${images.length * (height || 600)}px`
          }}
        >
          {images.map((img, idx) => (
            <figure 
              key={idx} 
              className="bwp-post-slider-item" 
              style={{ 
                width: "100%", 
                height: height ? `${height}px` : "auto",
                flexShrink: 0 
              }}
            >
              <a 
                href={img} 
                className="bwp-popup-gallery-item" 
                title={lightboxTitle(img, idx)}
              >
                <Image 
                  width={900} 
                  height={600} 
                  src={img} 
                  alt={`${title} image ${idx + 1}`} 
                  priority={idx === 0}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <span className="bwp-post-media-overlay"></span>
                <span className="bwp-post-hover-icon bwp-expand-image">
                  <i className="far fa-images"></i>
                </span>
              </a>
            </figure>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="tns-controls">
          <button 
            type="button" 
            data-controls="prev"
            onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))} 
            disabled={activeIndex === 0}
            aria-label="Previous image"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            type="button" 
            data-controls="next"
            onClick={() => setActiveIndex(prev => Math.min(images.length - 1, prev + 1))} 
            disabled={activeIndex === images.length - 1}
            aria-label="Next image"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
