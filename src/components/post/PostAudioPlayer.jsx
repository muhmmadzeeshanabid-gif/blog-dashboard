"use client";

import { useState, useRef, useEffect, useMemo } from "react";

export default function PostAudioPlayer({ audioUrl, title, author = "Admin", image }) {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverPercentage, setHoverPercentage] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);

  // Generate a beautiful, organic-looking waveform envelope
  const waveformBars = useMemo(() => {
    const bars = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const envelope = Math.sin(progress * Math.PI); // Smooth arc (low -> high -> low)
      
      // Layer sine waves to create organic peaks and valleys
      const wave1 = Math.sin(i * 0.12) * 0.35;
      const wave2 = Math.cos(i * 0.3) * 0.15;
      const wave3 = Math.sin(i * 0.75) * 0.1;
      
      // Calculate final height with base min of 8% and max of 95%
      const height = 12 + 83 * envelope * (0.6 + wave1 + wave2 + wave3);
      bars.push(Math.max(8, Math.min(95, height)));
    }
    return bars;
  }, []);

  // Format seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleWaveformMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverPercentage(percentage * 100);
  };

  const handleWaveformMouseLeave = () => {
    setHoverPercentage(null);
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

  // Mock comments to render along the timeline like SoundCloud
  const mockComments = [
    { pct: 15, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=60", comment: "Amazing intro!" },
    { pct: 32, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=60", comment: "This chord progression is beautiful ❤️" },
    { pct: 55, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=60", comment: "Total relaxation vibes..." },
    { pct: 78, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=60", comment: "Pure perfection." },
    { pct: 92, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=60", comment: "Listening to this on repeat!" }
  ];

  // Default gradient background if no post image is provided
  const bgStyle = image
    ? { backgroundImage: `url(${image})` }
    : { background: "linear-gradient(135deg, #2e2e38 0%, #17171e 100%)" };

  const currentPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bwp-custom-audio-player-container" style={bgStyle}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
      />

      {/* Dark Ambient Overlay */}
      <div className="bwp-player-overlay" />

      {/* Top Section */}
      <div className="bwp-player-top-row">
        {/* Play Button & Title Section */}
        <div className="bwp-player-meta-left">
          <button 
            className="bwp-player-play-btn" 
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
          </button>
          
          <div className="bwp-player-info-badges">
            <span className="bwp-badge-author">{author}</span>
            <span className="bwp-badge-title">{title}</span>
          </div>
        </div>

        {/* SoundCloud Branding & Right Actions */}
        <div className="bwp-player-meta-right">
          <div className="bwp-soundcloud-branding">
            <svg height="22" viewBox="0 0 48 24" fill="currentColor">
              <path d="M18 19h20c3.31 0 6-2.69 6-6s-2.69-6-6-6c-.34 0-.67.04-1 .11C35.9 4.19 32.22 2 28 2c-4.97 0-9.15 3.03-10.84 7.37C16.37 9.13 15.2 9 14 9c-4.42 0-8 3.58-8 8a7.99 7.99 0 008 8h4v-6zm-16-5h1v6H2v-6zm3-2h1v8H5v-8zm3-1h1v9H8v-9zm3-1h1v10h-1V10zm3-2h1v12h-1V8z" />
            </svg>
            <span className="bwp-soundcloud-text">SOUNDCLOUD</span>
          </div>

          <div className="bwp-player-action-buttons">
            <a 
              href={audioUrl} 
              download={`${title}.mp3`}
              className="bwp-player-action-btn"
              title="Download Track"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fas fa-download"></i>
            </a>

            <button 
              className="bwp-player-action-btn share-btn"
              onClick={handleShareClick}
              title="Share Track"
            >
              <i className="fas fa-share-square"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Visualizer Section */}
      <div className="bwp-player-waveform-section">
        <div 
          className="bwp-player-waveform-container"
          ref={waveformRef}
          onClick={handleWaveformClick}
          onMouseMove={handleWaveformMouseMove}
          onMouseLeave={handleWaveformMouseLeave}
        >
          {waveformBars.map((barHeight, idx) => {
            const barPercentage = (idx / waveformBars.length) * 100;
            const isPlayed = barPercentage <= currentPercentage;
            const isHoveredPreview = hoverPercentage !== null && barPercentage <= hoverPercentage;

            let barBg = "rgba(255, 255, 255, 0.4)";
            if (isPlayed) {
              barBg = "#ff5500";
            } else if (isHoveredPreview) {
              barBg = "#ffaa80"; // Light orange preview on hover
            }

            return (
              <div
                key={idx}
                className="bwp-waveform-bar"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: barBg
                }}
              />
            );
          })}

          {/* Render Mock Comment Avatars */}
          {mockComments.map((item, idx) => (
            <div
              key={idx}
              className="bwp-comment-avatar-node"
              style={{ left: `${item.pct}%` }}
              title={item.comment}
            >
              <img src={item.avatar} alt="User Comment" />
              <div className="bwp-comment-tooltip">{item.comment}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Timing Row */}
      <div className="bwp-player-bottom-row">
        <span className="bwp-player-privacy-text">Privacy policy</span>
        
        <div className="bwp-player-time-badge">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="bwp-player-toast">
          Link copied to clipboard!
        </div>
      )}

      {/* Embedded CSS Styles */}
      <style jsx>{`
        .bwp-custom-audio-player-container {
          position: relative;
          width: 100%;
          height: 400px;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          font-family: Inter, system-ui, sans-serif;
          user-select: none;
        }

        .bwp-player-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.65) 0%,
            rgba(0, 0, 0, 0.25) 45%,
            rgba(0, 0, 0, 0.7) 100%
          );
          z-index: 1;
        }

        .bwp-player-top-row {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .bwp-player-meta-left {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .bwp-player-play-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #ff5500;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .bwp-player-play-btn:hover {
          transform: scale(1.08);
          background-color: #ff6a1a;
        }

        .bwp-player-play-btn i {
          margin-left: 2px;
        }

        .bwp-player-play-btn i.fa-pause {
          margin-left: 0;
        }

        .bwp-player-info-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .bwp-badge-author {
          font-size: 11px;
          color: #d1d1d6;
          background-color: rgba(0, 0, 0, 0.82);
          padding: 2px 8px;
          border-radius: 2px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .bwp-badge-title {
          font-size: 16px;
          color: #ffffff;
          background-color: rgba(0, 0, 0, 0.82);
          padding: 4px 10px;
          border-radius: 2px;
          font-weight: 600;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .bwp-player-meta-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .bwp-soundcloud-branding {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ffffff;
          opacity: 0.9;
        }

        .bwp-soundcloud-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .bwp-player-action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bwp-player-action-btn {
          height: 26px;
          border-radius: 3px;
          background-color: rgba(0, 0, 0, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e5e5ea;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          font-size: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          gap: 5px;
        }

        .bwp-player-action-btn:hover {
          background-color: #ff5500;
          color: #ffffff;
          border-color: #ff5500;
        }

        .bwp-player-waveform-section {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 150px;
          margin-top: auto;
          margin-bottom: 5px;
          display: flex;
          align-items: flex-end;
        }

        .bwp-player-waveform-container {
          position: relative;
          width: 100%;
          height: 110px;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          cursor: pointer;
        }

        .bwp-waveform-bar {
          flex: 1;
          border-radius: 1px 1px 0 0;
          transition: background-color 0.1s linear;
        }

        /* Mock Comments Styles */
        .bwp-comment-avatar-node {
          position: absolute;
          bottom: -4px;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          overflow: visible;
          border: 1px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 5;
        }

        .bwp-comment-avatar-node img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .bwp-comment-tooltip {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) scale(0.85);
          background-color: rgba(0, 0, 0, 0.9);
          color: #ffffff;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 3px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.15s ease-in-out;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          pointer-events: none;
        }

        .bwp-comment-avatar-node:hover {
          transform: translateX(-50%) scale(1.25);
          z-index: 10;
        }

        .bwp-comment-avatar-node:hover .bwp-comment-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) scale(1);
        }

        .bwp-player-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-top: 5px;
        }

        .bwp-player-privacy-text {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          background-color: rgba(0, 0, 0, 0.5);
          padding: 1px 4px;
          border-radius: 2px;
        }

        .bwp-player-time-badge {
          font-size: 11px;
          color: #ffffff;
          background-color: rgba(0, 0, 0, 0.82);
          padding: 2px 6px;
          border-radius: 2px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .bwp-player-toast {
          position: absolute;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(255, 85, 0, 0.95);
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 4px;
          z-index: 15;
          box-shadow: 0 4px 15px rgba(0,0,0,0.35);
          animation: fadeInOut 2s ease;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
