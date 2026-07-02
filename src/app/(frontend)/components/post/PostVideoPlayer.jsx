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

export default function PostVideoPlayer({ videoUrl, poster, title, author = "Admin", authorAvatar = "" }) {
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

  // New settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSubMenu, setCurrentSubMenu] = useState("main");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [videoBlur, setVideoBlur] = useState("");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [badgeText, setBadgeText] = useState("");
  const [showBadge, setShowBadge] = useState(false);

  const showOverlayBadge = (text) => {
    setBadgeText(text);
    setShowBadge(true);
  };

  useEffect(() => {
    if (showBadge) {
      const timer = setTimeout(() => {
        setShowBadge(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showBadge]);

  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only auto-hide if settings menu is NOT open
    if (videoRef.current && !videoRef.current.paused && !isSettingsOpen) {
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
      // If settings menu is open, don't hide controls
      if (!isSettingsOpen) {
        setShowControls(false);
      }
    }
  };

  const handlePlayClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsSettingsOpen(false); // Close settings menu on play/pause
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

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsSettingsOpen(false);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // fallback if CORS prevents direct download
      const a = document.createElement("a");
      a.href = videoUrl;
      a.target = "_blank";
      a.download = `${title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleVolumeChange = (newVal) => {
    setVolume(newVal);
    if (videoRef.current) {
      videoRef.current.volume = newVal;
      videoRef.current.muted = newVal === 0;
    }
    setIsMuted(newVal === 0);
  };

  const handleVolumeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && videoRef.current.volume === 0) {
        videoRef.current.volume = 0.5;
        setVolume(0.5);
      }
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

  // Sync controls visibility with settings state
  useEffect(() => {
    if (isSettingsOpen) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
    } else {
      triggerShowControls();
    }
  }, [isSettingsOpen]);

  // Click outside to close settings menu
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
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
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: videoBlur, transition: "filter 0.3s ease" }}
            >
              <source src={videoUrl} />
            </video>

            {/* Center Temporary Overlay Badge */}
            {showBadge && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(10, 10, 10, 0.85)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "30px",
                fontSize: "14px",
                fontWeight: "600",
                zIndex: 29,
                fontFamily: "Poppins, sans-serif",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                animation: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}>
                <i className="fas fa-play" style={{ fontSize: "10px", color: "#00adef" }}></i>
                <span>{badgeText}</span>
              </div>
            )}

            {/* Quality change simulated loader */}
            {isChangingQuality && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 28
                }}
              >
                <div className="bwp-video-loading-spinner"></div>
              </div>
            )}

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
                    src={authorAvatar || "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=400&d=mm&r=g"}
                    alt={author}
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.src = "https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=400&d=mm&r=g";
                    }}
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

                {/* Volume Controls Container */}
                <div 
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "24px"
                  }}
                >
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
                      height: "24px",
                      transition: "color 0.2s"
                    }}
                  >
                    <i className={isMuted ? "fas fa-volume-mute" : volume > 0.5 ? "fas fa-volume-up" : "fas fa-volume-down"}></i>
                  </button>

                  {/* Volume Slider Bar (Expands on Hover) */}
                  <div style={{
                    width: showVolumeSlider ? "60px" : "0px",
                    opacity: showVolumeSlider ? 1 : 0,
                    overflow: "hidden",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    display: "flex",
                    alignItems: "center",
                    height: "100%"
                  }}>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "60px",
                        height: "4px",
                        WebkitAppearance: "none",
                        backgroundColor: "rgba(255,255,255,0.3)",
                        borderRadius: "2px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                      className="bwp-volume-slider"
                    />
                  </div>
                </div>

                {/* Settings Gear */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsOpen(!isSettingsOpen);
                    setCurrentSubMenu("main");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: isSettingsOpen ? "#00adef" : "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    transition: "all 0.3s ease",
                    transform: isSettingsOpen ? "rotate(45deg)" : "rotate(0deg)"
                  }}
                  title="Settings"
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

              {/* Settings Dropdown Menu */}
              {isSettingsOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    bottom: "52px",
                    right: "16px",
                    width: "240px",
                    backgroundColor: "rgba(10, 10, 10, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    zIndex: 35,
                    color: "#ffffff",
                    fontSize: "13px",
                    fontFamily: "Poppins, sans-serif",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                    transition: "height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    overflow: "hidden",
                    height: currentSubMenu === "main" ? "150px" : currentSubMenu === "speed" ? "255px" : "185px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    width: "720px",
                    transform: currentSubMenu === "main" 
                      ? "translateX(0px)" 
                      : currentSubMenu === "speed" 
                        ? "translateX(-240px)" 
                        : "translateX(-480px)",
                    transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
                  }}>
                    {/* PANEL 1: MAIN MENU */}
                    <div style={{ width: "240px", flexShrink: 0, padding: "10px 0", boxSizing: "border-box" }}>
                      {/* Playback Speed Option */}
                      <div 
                        onClick={() => setCurrentSubMenu("speed")}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        className="bwp-settings-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <i className="fas fa-history" style={{ fontSize: "14px", width: "16px", flexShrink: 0, textAlign: "center", opacity: 0.85 }}></i>
                          <span style={{ fontSize: "13px", fontWeight: "500", color: "#ffffff", whiteSpace: "nowrap" }}>Playback Speed</span>
                        </span>
                        <span style={{ color: "#00adef", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500", flexShrink: 0, marginLeft: "8px" }}>
                          {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
                          <i className="fas fa-chevron-right" style={{ fontSize: "9px", opacity: 0.7 }}></i>
                        </span>
                      </div>

                      {/* Quality Option */}
                      <div 
                        onClick={() => setCurrentSubMenu("quality")}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        className="bwp-settings-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <i className="fas fa-sliders-h" style={{ fontSize: "13px", width: "16px", flexShrink: 0, textAlign: "center", opacity: 0.85 }}></i>
                          <span style={{ fontSize: "13px", fontWeight: "500", color: "#ffffff", whiteSpace: "nowrap" }}>Quality</span>
                        </span>
                        <span style={{ color: "#00adef", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500", flexShrink: 0, marginLeft: "8px" }}>
                          {quality}
                          <i className="fas fa-chevron-right" style={{ fontSize: "9px", opacity: 0.7 }}></i>
                        </span>
                      </div>

                      <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)", margin: "8px 0" }}></div>

                      {/* Download Option */}
                      <div 
                        onClick={handleDownload}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        className="bwp-settings-item"
                      >
                        <i className="fas fa-download" style={{ fontSize: "13px", width: "16px", flexShrink: 0, textAlign: "center", opacity: 0.85 }}></i>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#ffffff", whiteSpace: "nowrap" }}>Download Video</span>
                      </div>
                    </div>

                    {/* PANEL 2: PLAYBACK SPEED */}
                    <div style={{ width: "240px", flexShrink: 0, padding: "4px 0", boxSizing: "border-box" }}>
                      <div 
                        onClick={() => setCurrentSubMenu("main")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 18px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                          cursor: "pointer",
                          fontWeight: "600",
                          color: "#00adef",
                          fontSize: "12px"
                        }}
                      >
                        <i className="fas fa-chevron-left" style={{ fontSize: "10px" }}></i>
                        <span>Playback Speed</span>
                      </div>
                      <div style={{ padding: "4px 0" }}>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <div
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              if (videoRef.current) {
                                videoRef.current.playbackRate = speed;
                              }
                              setCurrentSubMenu("main");
                              showOverlayBadge(speed === 1 ? "Normal" : `${speed}x`);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 18px 8px 38px",
                              cursor: "pointer",
                              position: "relative",
                              color: playbackSpeed === speed ? "#00adef" : "#ffffff",
                              fontSize: "12.5px",
                              transition: "background 0.2s"
                            }}
                            className="bwp-settings-item"
                          >
                            {playbackSpeed === speed && (
                              <i className="fas fa-check" style={{
                                position: "absolute",
                                left: "18px",
                                fontSize: "10px",
                                color: "#00adef"
                              }}></i>
                            )}
                            <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PANEL 3: QUALITY */}
                    <div style={{ width: "240px", flexShrink: 0, padding: "4px 0", boxSizing: "border-box" }}>
                      <div 
                        onClick={() => setCurrentSubMenu("main")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 18px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                          cursor: "pointer",
                          fontWeight: "600",
                          color: "#00adef",
                          fontSize: "12px"
                        }}
                      >
                        <i className="fas fa-chevron-left" style={{ fontSize: "10px" }}></i>
                        <span>Quality</span>
                      </div>
                      <div style={{ padding: "4px 0" }}>
                        {["Auto", "1080p", "720p", "480p"].map((q) => (
                          <div
                            key={q}
                            onClick={() => {
                              setQuality(q);
                              setCurrentSubMenu("main");
                              setIsChangingQuality(true);
                              const wasPlaying = isPlaying;
                              if (videoRef.current && wasPlaying) {
                                videoRef.current.pause();
                              }
                              setTimeout(() => {
                                setIsChangingQuality(false);
                                if (videoRef.current && wasPlaying) {
                                  videoRef.current.play().catch(() => {});
                                }
                                if (q === "480p") {
                                  setVideoBlur("blur(1.5px) contrast(0.95)");
                                } else if (q === "720p") {
                                  setVideoBlur("blur(0.6px)");
                                } else {
                                  setVideoBlur("");
                                }
                                showOverlayBadge(`Quality: ${q}`);
                              }, 800);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 18px 8px 38px",
                              cursor: "pointer",
                              position: "relative",
                              color: quality === q ? "#00adef" : "#ffffff",
                              fontSize: "12.5px",
                              transition: "background 0.2s"
                            }}
                            className="bwp-settings-item"
                          >
                            {quality === q && (
                              <i className="fas fa-check" style={{
                                position: "absolute",
                                left: "18px",
                                fontSize: "10px",
                                color: "#00adef"
                              }}></i>
                            )}
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
        .bwp-settings-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .bwp-video-loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.15);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border-left-color: #00adef;
          animation: bwp-spin 0.8s linear infinite;
        }
        @keyframes bwp-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        .bwp-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00adef;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .bwp-volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        .bwp-volume-slider::-moz-range-thumb {
          width: 8px;
          height: 8px;
          border: none;
          border-radius: 50%;
          background: #00adef;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .bwp-volume-slider::-moz-range-thumb:hover {
          transform: scale(1.3);
        }
        @keyframes scaleIn {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </figure>
  );
}
