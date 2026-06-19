"use client";

import { useEffect } from "react";

const ANIMATION_SPEED = 550;

function getBackgroundUrl(backgroundNode) {
  const backgroundImage = backgroundNode?.style.backgroundImage;
  const match = backgroundImage?.match(/url\((['"]?)(.*?)\1\)/);
  if (match?.[2]) {
    return match[2];
  }

  // Support preloading of nested img elements (Next.js Image component)
  const img = backgroundNode?.querySelector("img");
  return img?.src || img?.getAttribute("src") || "";
}

export default function useHeroSlider(heroPosts, sliderId = "bwp-homepage-slider") {
  useEffect(() => {
    const slider = document.getElementById(sliderId);
    const loadingIcon = document.getElementById(`${sliderId}-loading-icon`);

    if (!slider) {
      return undefined;
    }

    const slides = Array.from(slider.querySelectorAll(".bwp-homepage-slider-item"));
    if (!slides.length) {
      return undefined;
    }

    const sliderWrap = slider.parentElement;
    if (!sliderWrap) {
      return undefined;
    }

    const controls = document.createElement("div");
    controls.className = "tns-controls";
    controls.innerHTML = `
      <button type="button" data-controls="prev" aria-label="Previous slide"><i class="fas fa-chevron-left"></i></button>
      <button type="button" data-controls="next" aria-label="Next slide"><i class="fas fa-chevron-right"></i></button>
    `;

    const nav = document.createElement("div");
    nav.className = "tns-nav";
    nav.setAttribute("aria-label", "Slider pagination");
    nav.innerHTML = slides
      .map((_, index) => `<button type="button" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>`)
      .join("");

    sliderWrap.appendChild(controls);
    sliderWrap.appendChild(nav);

    slider.classList.add("tns-slider", "tns-gallery");
    slider.style.position = "relative";
    slider.style.height = "100%";
    slider.style.overflow = "hidden";

    slides.forEach((slide) => {
      slide.classList.add("tns-item");
      slide.style.position = "absolute";
      slide.style.inset = "0";
      slide.style.width = "100%";
      slide.style.height = "100%";
      slide.style.transition = `transform ${ANIMATION_SPEED}ms ease, opacity ${ANIMATION_SPEED}ms ease`;
      slide.style.transform = "translate3d(0, 100%, 0)";
      slide.style.opacity = "0";
      slide.style.visibility = "hidden";
      slide.style.pointerEvents = "none";
    });

    const navButtons = Array.from(nav.querySelectorAll("button"));
    const prevButton = controls.querySelector('[data-controls="prev"]');
    const nextButton = controls.querySelector('[data-controls="next"]');

    let activeIndex = 0;
    let animationTimeoutId;
    let loadingTimeoutId;
    let contentReady = false;
    const preloadCleanups = [];

    const setSlideInnerState = (slide, isActive) => {
      const overlay = slide.querySelector(".bwp-homepage-slider-item-overlay");
      const zoom = slide.querySelector(".bwp-homepage-slider-zoom-image");
      const content = slide.querySelector(".bwp-homepage-slider-content-text");

      const shouldShow = contentReady && isActive;
      overlay?.classList.toggle("bwp-visible", shouldShow);
      zoom?.classList.toggle("bwp-visible", shouldShow);
      content?.classList.toggle("bwp-visible", shouldShow);
    };

    const resetSlidePosition = (slide, offsetY) => {
      slide.style.transform = `translate3d(0, ${offsetY}%, 0)`;
      slide.style.opacity = "0";
      slide.style.visibility = "hidden";
      slide.style.pointerEvents = "none";
      setSlideInnerState(slide, false);
    };

    const setActiveSlide = (slide) => {
      slide.style.transform = "translate3d(0, 0, 0)";
      slide.style.opacity = "1";
      slide.style.visibility = "visible";
      slide.style.pointerEvents = "auto";
      setSlideInnerState(slide, true);
    };

    const updateControlsState = () => {
      if (prevButton) {
        prevButton.disabled = activeIndex === 0;
      }

      if (nextButton) {
        nextButton.disabled = activeIndex === slides.length - 1;
      }
    };

    const activateSlide = (index, immediate = false) => {
      if (index < 0 || index >= slides.length) {
        return;
      }

      const nextIndex = index;

      if (immediate || nextIndex === activeIndex) {
        slides.forEach((slide, slideIndex) => {
          if (slideIndex === nextIndex) {
            setActiveSlide(slide);
            return;
          }

          resetSlidePosition(slide, 100);
        });
      } else {
        window.clearTimeout(animationTimeoutId);

        const currentSlide = slides[activeIndex];
        const nextSlide = slides[nextIndex];
        const direction = nextIndex > activeIndex ? 1 : -1;

        nextSlide.style.transition = "none";
        nextSlide.style.visibility = "visible";
        nextSlide.style.pointerEvents = "none";
        nextSlide.style.opacity = "1";
        nextSlide.style.transform = `translate3d(0, ${direction * 100}%, 0)`;
        setSlideInnerState(nextSlide, true);

        window.requestAnimationFrame(() => {
          nextSlide.style.transition = `transform ${ANIMATION_SPEED}ms ease, opacity ${ANIMATION_SPEED}ms ease`;
          currentSlide.style.visibility = "visible";
          currentSlide.style.pointerEvents = "none";
          currentSlide.style.opacity = "1";
          currentSlide.style.transform = `translate3d(0, ${direction * -100}%, 0)`;
          nextSlide.style.transform = "translate3d(0, 0, 0)";
        });

        animationTimeoutId = window.setTimeout(() => {
          resetSlidePosition(currentSlide, direction * -100);
          setActiveSlide(nextSlide);
        }, ANIMATION_SPEED);
      }

      activeIndex = nextIndex;

      navButtons.forEach((button, buttonIndex) => {
        button.classList.toggle("tns-nav-active", buttonIndex === nextIndex);
      });

      updateControlsState();
    };

    const onPrev = () => activateSlide(activeIndex - 1);
    const onNext = () => activateSlide(activeIndex + 1);

    prevButton?.addEventListener("click", onPrev);
    nextButton?.addEventListener("click", onNext);

    const navHandlers = navButtons.map((button, index) => {
      const handler = () => activateSlide(index);
      button.addEventListener("click", handler);
      return { button, handler };
    });

    activateSlide(0, true);

    const backgroundNodes = slides
      .map((slide) => slide.querySelector(".bwp-homepage-slider-item-bg"))
      .filter(Boolean);

    const finishLoading = () => {
      backgroundNodes.forEach((backgroundNode) => {
        backgroundNode.style.opacity = "1";
      });

      loadingIcon?.classList.add("bwp-hidden");
      loadingTimeoutId = window.setTimeout(() => {
        if (loadingIcon) {
          loadingIcon.style.display = "none";
        }
        contentReady = true;
        setSlideInnerState(slides[activeIndex], true);
      }, 150);
    };

    let pendingImages = 0;

    backgroundNodes.forEach((backgroundNode) => {
      const backgroundUrl = getBackgroundUrl(backgroundNode);
      if (!backgroundUrl) {
        return;
      }

      pendingImages += 1;

      const image = new window.Image();
      const onImageDone = () => {
        pendingImages -= 1;
        if (pendingImages === 0) {
          finishLoading();
        }
      };

      image.addEventListener("load", onImageDone, { once: true });
      image.addEventListener("error", onImageDone, { once: true });
      image.src = backgroundUrl;

      preloadCleanups.push(() => {
        image.removeEventListener("load", onImageDone);
        image.removeEventListener("error", onImageDone);
      });
    });

    if (pendingImages === 0) {
      finishLoading();
    }

    return () => {
      window.clearTimeout(animationTimeoutId);
      window.clearTimeout(loadingTimeoutId);
      preloadCleanups.forEach((cleanup) => cleanup());
      prevButton?.removeEventListener("click", onPrev);
      nextButton?.removeEventListener("click", onNext);
      navHandlers.forEach(({ button, handler }) => {
        button.removeEventListener("click", handler);
      });
      controls.remove();
      nav.remove();

      slides.forEach((slide) => {
        slide.classList.remove("tns-item");
        slide.style.position = "";
        slide.style.inset = "";
        slide.style.width = "";
        slide.style.height = "";
        slide.style.transition = "";
        slide.style.transform = "";
        slide.style.opacity = "";
        slide.style.visibility = "";
        slide.style.pointerEvents = "";
        slide.querySelector(".bwp-homepage-slider-item-bg")?.style.removeProperty("opacity");
        slide.querySelector(".bwp-homepage-slider-item-overlay")?.classList.remove("bwp-visible");
        slide.querySelector(".bwp-homepage-slider-zoom-image")?.classList.remove("bwp-visible");
        slide.querySelector(".bwp-homepage-slider-content-text")?.classList.remove("bwp-visible");
      });

      slider.classList.remove("tns-slider", "tns-gallery");
      slider.style.position = "";
      slider.style.height = "";
      slider.style.overflow = "";
      if (loadingIcon) {
        loadingIcon.style.display = "";
        loadingIcon.classList.remove("bwp-hidden");
      }
    };
  }, [heroPosts]);
}
