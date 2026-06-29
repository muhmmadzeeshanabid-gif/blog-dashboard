"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url ?? ""));
}

function getVideoEmbedSource(url) {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtube.com") && parsedUrl.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsedUrl.searchParams.get("v")}`;
    }
    if (parsedUrl.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsedUrl.pathname.replace(/\//g, "")}`;
    }
    if (parsedUrl.hostname.includes("vimeo.com") && !parsedUrl.hostname.includes("player.")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }
  return url;
}

export default function PostVideoPlayer({ videoUrl, poster, title, author = "Admin" }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const handleMouseMove = () => {
    triggerShowControls();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(false);
    }
  };

  const handlePlayClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        triggerShowControls();
      }
    }
  };

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleWatchLaterClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWatchLater(!isWatchLater);
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setShowShareToast(true);
          setTimeout(() => setShowShareToast(false), 2000);
        })
        .catch(() => {});
    }
  };

  const handleVolumeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleFullscreenToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minStr}:${secStr}`;
  };

  const isDirect = isDirectVideoFile(videoUrl);
  const isOverlayVisible = !isPlaying || showControls;

  return (
    <figure className="bwp-post-media bwp-video-player">
      <div className="bwp-iframe-video-wrap">
        {isDirect ? (
          <div 
            ref={containerRef}
            className="bwp-local-video-container" 
            onClick={handlePlayClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              position: "absolute", 
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: isOverlayVisible ? "default" : "none", 
              backgroundColor: "#000",
              borderRadius: "2px",
              overflow: "hidden"
            }}
          >
            <video
              ref={videoRef}
              preload="metadata"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClick(e);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            >
              <source src={videoUrl} />
            </video>

            {/* Overlays Wrapper (Controlled by visibility states) */}
            <div 
              className="bwp-video-vimeo-overlay-container"
              style={{
                opacity: isOverlayVisible ? 1 : 0,
                visibility: isOverlayVisible ? "visible" : "hidden",
                transition: "opacity 0.3s ease, visibility 0.3s ease"
              }}
            >
              {/* Top Left: Avatar + Badges */}
              <div 
                className="bwp-video-vimeo-top-left"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  zIndex: 20,
                  pointerEvents: "auto"
                }}
              >
                <div style={{
                  position: "relative",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "2.5px solid #00adef",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  backgroundColor: "#111"
                }}>
                  <Image 
                    src="https://secure.gravatar.com/avatar/602f3bb4e42cc75168bc6a987cf48ca3?s=400&d=mm&r=g"
                    alt={author}
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
                  <div style={{
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "3px",
                    fontFamily: "Poppins, sans-serif",
                    letterSpacing: "0.2px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                  }}>
                    {title}
                  </div>
                  <div style={{
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    color: "#9f9f9f",
                    fontSize: "11px",
                    fontWeight: "500",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontFamily: "Poppins, sans-serif",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                  }}>
                    {author}
                  </div>
                </div>
              </div>

              {/* Top Right: Stacked buttons */}
              <div 
                className="bwp-video-vimeo-top-right"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  zIndex: 20,
                  pointerEvents: "auto"
                }}
              >
                {/* Like / Heart */}
                <button 
                  onClick={handleLikeClick}
                  title="Like"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: isLiked ? "#00adef" : "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                >
                  <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i>
                </button>

                {/* Watch Later / Clock */}
                <button 
                  onClick={handleWatchLaterClick}
                  title="Watch Later"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: isWatchLater ? "#00adef" : "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                >
                  <i className={isWatchLater ? "fas fa-clock" : "far fa-clock"}></i>
                </button>

                {/* Share / Paper Plane */}
                <button 
                  onClick={handleShareClick}
                  title="Share"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div 
                className="bwp-video-vimeo-bottom-bar"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "44px",
                  background: "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0) 100%)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 15px",
                  gap: "12px",
                  zIndex: 25,
                  pointerEvents: "auto",
                  fontFamily: "Poppins, sans-serif"
                }}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayClick}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    transition: "color 0.2s"
                  }}
                >
                  <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
                </button>

                {/* Progress Bar Timeline Wrapper */}
                <div 
                  ref={progressRef}
                  onClick={handleProgressClick}
                  style={{
                    flex: 1,
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    cursor: "pointer"
                  }}
                >
                  {/* Timeline Track */}
                  <div style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                    borderRadius: "2px",
                    position: "relative"
                  }}>
                    {/* Progress Fill */}
                    <div style={{
                      height: "100%",
                      backgroundColor: "#00adef",
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      borderRadius: "2px"
                    }} />
                  </div>

                  {/* Floating Time Badge (Vimeo Style) */}
                  {duration > 0 && (
                    <div style={{
                      position: "absolute",
                      bottom: "22px",
                      left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      transform: "translateX(-50%)",
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 5px",
                      borderRadius: "3px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      fontFamily: "Poppins, sans-serif",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                      <span>{formatTime(currentTime)}</span>
                      {/* Little Down Arrow tip */}
                      <div style={{
                        width: 0,
                        height: 0,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: "4px solid #ffffff",
                        position: "absolute",
                        bottom: "-4px",
                        left: "50%",
                        transform: "translateX(-50%)"
                      }} />
                    </div>
                  )}
                </div>

                {/* Volume Button */}
                <button
                  onClick={handleVolumeToggle}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px"
                  }}
                >
                  <i className={isMuted ? "fas fa-volume-mute" : volume > 0.5 ? "fas fa-volume-up" : "fas fa-volume-down"}></i>
                </button>

                {/* Settings Gear */}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px"
                  }}
                >
                  <i className="fas fa-cog"></i>
                </button>

                {/* Picture in Picture Button */}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px"
                  }}
                  title="Picture in Picture"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current && document.pictureInPictureEnabled) {
                      if (document.pictureInPictureElement) {
                        document.exitPictureInPicture().catch(() => {});
                      } else {
                        videoRef.current.requestPictureInPicture().catch(() => {});
                      }
                    }
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <rect x="13" y="10" width="8" height="6" rx="1" ry="1" fill="currentColor" />
                  </svg>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreenToggle}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px"
                  }}
                >
                  <i className={isFullscreen ? "fas fa-compress" : "fas fa-expand"}></i>
                </button>

                {/* Vimeo Logo Text */}
                <span style={{
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "800",
                  fontStyle: "italic",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  opacity: 0.85,
                  cursor: "default",
                  userSelect: "none",
                  marginLeft: "4px"
                }}>
                  vimeo
                </span>
              </div>
            </div>

            {/* Share Toast Notification */}
            {showShareToast && (
              <div style={{
                position: "absolute",
                bottom: "60px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 173, 239, 0.95)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "4px",
                zIndex: 30,
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                fontFamily: "Poppins, sans-serif",
                animation: "fadeInOut 2s ease"
              }}>
                Link copied to clipboard!
              </div>
            )}

          </div>
        ) : (
          <iframe
            src={getVideoEmbedSource(videoUrl)}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            style={{ width: "100%", border: "none", aspectRatio: "16/9", display: "block" }}
          />
        )}
      </div>
      <style jsx global>{`
        .bwp-video-vimeo-top-right button:hover,
        .bwp-video-vimeo-bottom-bar button:hover {
          color: #00adef !important;
          transform: scale(1.05);
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </figure>
  );
}
