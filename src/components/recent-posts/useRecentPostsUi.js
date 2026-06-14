"use client";

import { useEffect } from "react";

function resetMasonry(container, items) {
  container.style.position = "";
  container.style.height = "";

  items.forEach((item) => {
    item.style.position = "";
    item.style.top = "";
    item.style.left = "";
  });
}

function layoutMasonry(container, items) {
  if (window.innerWidth <= 991) {
    resetMasonry(container, items);
    return;
  }

  const firstItem = items[0];
  if (!firstItem) {
    return;
  }

  const columnProbe = container.querySelector(".bwp-col-size");
  const columnWidth = columnProbe?.getBoundingClientRect().width || firstItem.getBoundingClientRect().width;
  const columnCount = 3;
  const heights = new Array(columnCount).fill(0);

  container.style.position = "relative";

  items.forEach((item) => {
    const span = item.classList.contains("bwp-width-2x") ? 2 : 1;
    let targetColumn = 0;
    let minHeight = Number.POSITIVE_INFINITY;

    for (let columnIndex = 0; columnIndex <= columnCount - span; columnIndex += 1) {
      const groupHeight = Math.max(...heights.slice(columnIndex, columnIndex + span));
      if (groupHeight < minHeight) {
        minHeight = groupHeight;
        targetColumn = columnIndex;
      }
    }

    item.style.position = "absolute";
    item.style.top = `${minHeight}px`;
    item.style.left = `${targetColumn * columnWidth}px`;

    const nextHeight = minHeight + item.offsetHeight;
    for (let spanIndex = 0; spanIndex < span; spanIndex += 1) {
      heights[targetColumn + spanIndex] = nextHeight;
    }
  });

  container.style.height = `${Math.max(...heights)}px`;
}

function setupGallerySlider(sliderRoot, onRelayout) {
  const slides = Array.from(sliderRoot.querySelectorAll(".bwp-post-slider-item"));
  if (slides.length <= 1 || sliderRoot.parentElement?.querySelector(".tns-controls")) {
    return () => {};
  }

  const controls = document.createElement("div");
  controls.className = "tns-controls";
  controls.innerHTML = `
    <button type="button" data-controls="prev" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>
    <button type="button" data-controls="next" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>
  `;
  sliderRoot.parentElement?.appendChild(controls);

  const prevButton = controls.querySelector('[data-controls="prev"]');
  const nextButton = controls.querySelector('[data-controls="next"]');
  const track = document.createElement("div");

  track.className = "bwp-post-slider-track";
  track.style.transition = "transform 550ms ease";

  slides.forEach((slide) => {
    track.appendChild(slide);
  });

  sliderRoot.appendChild(track);

  let activeIndex = 0;
  let frameHeight = 0;

  const updateControlsState = () => {
    if (prevButton) {
      prevButton.disabled = activeIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = activeIndex === slides.length - 1;
    }
  };

  const refreshFrameHeight = () => {
    sliderRoot.style.height = "";
    track.style.height = "";
    slides.forEach((slide) => {
      slide.style.height = "";
    });

    frameHeight = Math.max(...slides.map((slide) => slide.offsetHeight), 0);
    if (!frameHeight) {
      return;
    }

    sliderRoot.style.height = `${frameHeight}px`;
    track.style.height = `${slides.length * frameHeight}px`;
    slides.forEach((slide) => {
      slide.style.height = `${frameHeight}px`;
    });
    track.style.transform = `translateY(-${activeIndex * frameHeight}px)`;
  };

  const showSlide = (index) => {
    if (index < 0 || index >= slides.length) {
      return;
    }

    activeIndex = index;
    track.style.transform = `translateY(-${activeIndex * frameHeight}px)`;
    updateControlsState();
    onRelayout?.();
  };

  const onPrev = () => showSlide(activeIndex - 1);
  const onNext = () => showSlide(activeIndex + 1);
  const onResize = () => {
    refreshFrameHeight();
    onRelayout?.();
  };

  prevButton?.addEventListener("click", onPrev);
  nextButton?.addEventListener("click", onNext);
  window.addEventListener("resize", onResize);

  const slideImages = slides
    .map((slide) => slide.querySelector("img"))
    .filter(Boolean);

  const onImageReady = () => {
    refreshFrameHeight();
    onRelayout?.();
  };

  slideImages.forEach((slideImage) => {
    slideImage.addEventListener("load", onImageReady);
    slideImage.addEventListener("error", onImageReady);
  });

  refreshFrameHeight();
  showSlide(0);

  return () => {
    prevButton?.removeEventListener("click", onPrev);
    nextButton?.removeEventListener("click", onNext);
    window.removeEventListener("resize", onResize);
    slideImages.forEach((slideImage) => {
      slideImage.removeEventListener("load", onImageReady);
      slideImage.removeEventListener("error", onImageReady);
    });
    slides.forEach((slide) => {
      slide.style.height = "";
      sliderRoot.appendChild(slide);
    });
    sliderRoot.style.height = "";
    track.style.height = "";
    track.style.transform = "";
    track.remove();
    controls.remove();
  };
}

export default function useRecentPostsUi(posts, currentPage) {
  useEffect(() => {
    const masonryRoot = document.getElementById("bwp-masonry");
    if (!masonryRoot) {
      return undefined;
    }

    const items = Array.from(masonryRoot.querySelectorAll(".bwp-masonry-item"));
    const relayout = () => layoutMasonry(masonryRoot, items);

    const galleryCleanups = Array.from(
      document.querySelectorAll(".bwp-post-media-slider .bwp-post-slider")
    ).map((sliderRoot) => setupGallerySlider(sliderRoot, relayout));

    const imageNodes = Array.from(masonryRoot.querySelectorAll("img"));
    const onImageReady = () => window.requestAnimationFrame(relayout);

    imageNodes.forEach((imageNode) => {
      imageNode.addEventListener("load", onImageReady);
      imageNode.addEventListener("error", onImageReady);
    });

    const resizeObserver = new ResizeObserver(() => relayout());
    resizeObserver.observe(masonryRoot);
    items.forEach((item) => resizeObserver.observe(item));

    window.addEventListener("resize", relayout);
    relayout();
    window.setTimeout(relayout, 250);
    window.setTimeout(relayout, 900);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", relayout);
      imageNodes.forEach((imageNode) => {
        imageNode.removeEventListener("load", onImageReady);
        imageNode.removeEventListener("error", onImageReady);
      });
      galleryCleanups.forEach((cleanup) => cleanup());
      resetMasonry(masonryRoot, items);
    };
  }, [posts, currentPage]);
}
