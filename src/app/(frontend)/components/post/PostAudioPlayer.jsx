"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./PostAudioPlayer.module.css";

function formatTime(timeInSeconds) {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function getDownloadExtension(url) {
  const match = String(url ?? "").match(/\.(mp3|wav|ogg|m4a|weba|webm|aac|flac)(\?.*)?$/i);
  return match ? `.${match[1].toLowerCase()}` : ".mp3";
}

function getDownloadName(title, url) {
  const safeTitle =
    String(title ?? "audio-track")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "audio-track";

  return `${safeTitle}${getDownloadExtension(url)}`;
}

function formatPercent(value) {
  return `${Number(value).toFixed(4)}%`;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height);
  context.lineTo(x, y + height);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
}

export default function PostAudioPlayer({ audioUrl, title, author = "Admin", image }) {
  const audioRef = useRef(null);
  const shareToastTimeoutRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const wavePanelRef = useRef(null);
  const playGradientId = `playButtonGradient-${useId().replace(/:/g, "")}`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverPercentage, setHoverPercentage] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const fallbackWaveformBars = useMemo(() => {
    const totalBars = 320;
    return Array.from({ length: totalBars }, (_, index) => {
      const progress = index / (totalBars - 1);
      const envelope = 0.26 + Math.sin(progress * Math.PI) * 0.74;
      const rhythm =
        Math.abs(Math.sin(index * 0.19)) * 0.52 +
        Math.abs(Math.cos(index * 0.075)) * 0.34 +
        Math.abs(Math.sin(index * 0.57)) * 0.18;

      return Number(Math.max(10, Math.min(100, (envelope * (0.45 + rhythm)) * 100)).toFixed(4));
    });
  }, []);
  const [decodedWaveform, setDecodedWaveform] = useState(() => ({ source: audioUrl, bars: null }));
  const currentPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const backgroundStyle = image ? { backgroundImage: `url(${image})` } : undefined;
  const downloadName = getDownloadName(title, audioUrl);
  const waveformBars =
    decodedWaveform.source === audioUrl && Array.isArray(decodedWaveform.bars) && decodedWaveform.bars.length > 0
      ? decodedWaveform.bars
      : fallbackWaveformBars;

  useEffect(() => {
    return () => {
      if (shareToastTimeoutRef.current) {
        clearTimeout(shareToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let audioContext = null;

    async function resolveWaveform() {
      if (typeof window === "undefined" || !audioUrl) {
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          return;
        }

        const audioBufferData = await response.arrayBuffer();
        audioContext = new AudioContextClass();
        const decodedBuffer = await audioContext.decodeAudioData(audioBufferData.slice(0));
        const channelData = decodedBuffer.getChannelData(0);
        const sampleCount = fallbackWaveformBars.length;
        const blockSize = Math.max(1, Math.floor(channelData.length / sampleCount));

        const sampledBars = Array.from({ length: sampleCount }, (_, index) => {
          const start = index * blockSize;
          const end = Math.min(channelData.length, start + blockSize);
          let peak = 0;
          let sumSquares = 0;
          let samples = 0;

          for (let cursor = start; cursor < end; cursor += 8) {
            const value = Math.abs(channelData[cursor] ?? 0);
            peak = Math.max(peak, value);
            sumSquares += value * value;
            samples += 1;
          }

          const rms = samples > 0 ? Math.sqrt(sumSquares / samples) : 0;
          return peak * 0.72 + rms * 0.28;
        });

        const maxAmplitude = Math.max(...sampledBars, 0.0001);
        const normalizedBars = sampledBars.map((value, index, values) => {
          const previous = values[index - 1] ?? value;
          const next = values[index + 1] ?? value;
          const smoothedValue = previous * 0.2 + value * 0.6 + next * 0.2;
          const normalizedValue = smoothedValue / maxAmplitude;
          return Number((12 + normalizedValue * 86).toFixed(4));
        });

        if (!isCancelled) {
          setDecodedWaveform({ source: audioUrl, bars: normalizedBars });
        }
      } catch {
        if (!isCancelled) {
          setDecodedWaveform({ source: audioUrl, bars: null });
        }
      } finally {
        if (audioContext) {
          audioContext.close().catch(() => {});
        }
      }
    }

    resolveWaveform();

    return () => {
      isCancelled = true;
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
    };
  }, [audioUrl, fallbackWaveformBars]);

  useEffect(() => {
    if (!waveCanvasRef.current || !wavePanelRef.current) {
      return;
    }

    const canvas = waveCanvasRef.current;
    const panel = wavePanelRef.current;

    const drawWaveform = () => {
      const bounds = panel.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(54, Math.floor(canvas.parentElement?.getBoundingClientRect().height ?? 74));
      const pixelRatio = window.devicePixelRatio || 1;
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const step = width / waveformBars.length;
      const barWidth = Math.max(1.35, step - 0.8);
      const playedPercentage = hoverPercentage === null ? currentPercentage : hoverPercentage;

      waveformBars.forEach((barHeight, index) => {
        const x = index * step;
        const renderedHeight = Math.max(5, (barHeight / 100) * height);
        const y = height - renderedHeight;
        const barPercentage = (index / (waveformBars.length - 1)) * 100;

        let fillStyle = "rgba(255, 255, 255, 0.88)";
        if (barPercentage <= currentPercentage) {
          fillStyle = "#ff5a14";
        } else if (hoverPercentage !== null && barPercentage <= playedPercentage) {
          fillStyle = "rgba(255, 217, 201, 0.94)";
        }

        context.fillStyle = fillStyle;
        drawRoundedRect(context, x, y, barWidth, renderedHeight, 1);
      });
    };

    drawWaveform();

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(drawWaveform);
    });

    resizeObserver.observe(panel);

    return () => {
      resizeObserver.disconnect();
    };
  }, [waveformBars, currentPercentage, hoverPercentage]);

  const handlePlayPause = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!audioRef.current) {
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      return;
    }

    audioRef.current.pause();
  };

  const handleWaveformSeek = (event) => {
    if (!audioRef.current || !duration) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const nextTime = percentage * duration;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleWaveformHover = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    setHoverPercentage(percentage);
  };

  const handleShareClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);

      if (shareToastTimeoutRef.current) {
        clearTimeout(shareToastTimeoutRef.current);
      }

      shareToastTimeoutRef.current = setTimeout(() => {
        setShowShareToast(false);
      }, 2000);
    } catch {
      // Ignore clipboard failures in browsers that block programmatic copy.
    }
  };

  const handleCardClick = (event) => {
    // Exclude waveform seek/hover panel clicks from toggling play/pause
    if (wavePanelRef.current && wavePanelRef.current.contains(event.target)) {
      return;
    }
    handlePlayPause(event);
  };

  return (
    <figure 
      className={`bwp-post-media bwp-audio-player ${styles.player}`}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
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
        className={styles.hiddenAudio}
      />

      <div className={styles.background} style={backgroundStyle} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.accentBar} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.metaGroup}>
            <button
              type="button"
              className={styles.playButton}
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              title={isPlaying ? "Pause" : "Play"}
            >
              <svg
                className={styles.playButtonSvg}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 43 43"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={playGradientId} x1="0%" y1="0%" x2="0%" y2="100%" spreadMethod="pad">
                    <stop offset="0%" stopColor="#ff5500" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="#ff2200" stopOpacity="1"></stop>
                  </linearGradient>
                </defs>
                <circle fill={`url(#${playGradientId})`} stroke="#cc4400" cx="21.5" cy="21.5" r="21"></circle>
                <circle className={styles.playButtonOverlay} fill="#000" fillOpacity="0.08" stroke="#cc4400" cx="21.5" cy="21.5" r="21"></circle>
                <path
                  className={`${styles.playGlyph} ${isPlaying ? styles.hiddenGlyph : ""}`}
                  fill="#fff"
                  d="M31,21.5L17,33l2.5-11.5L17,10L31,21.5z"
                ></path>
                <g fill="#fff" className={`${styles.pauseGlyph} ${isPlaying ? "" : styles.hiddenGlyph}`}>
                  <rect x="15" y="12" width="5" height="19"></rect>
                  <rect x="23" y="12" width="5" height="19"></rect>
                </g>
              </svg>
            </button>

            <div className={styles.labelStack}>
              <span className={styles.authorPill}>{author || "Admin"}</span>
              <span className={styles.titlePill}>{title || "Untitled track"}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <div className={styles.brand}>
              <i className="fab fa-soundcloud" aria-hidden="true"></i>
              <span>SOUNDCLOUD</span>
            </div>

            <div className={styles.actionRow}>
              <a
                href={audioUrl}
                download={downloadName}
                className={styles.iconButton}
                title="Download track"
                onClick={(event) => event.stopPropagation()}
              >
                <i className="fas fa-download" aria-hidden="true"></i>
              </a>

              <button
                type="button"
                className={styles.iconButton}
                title="Like track"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsLiked((currentValue) => !currentValue);
                }}
              >
                <i className={`${isLiked ? "fas" : "far"} fa-heart`} aria-hidden="true"></i>
              </button>

              <button
                type="button"
                className={`${styles.iconButton} ${styles.shareButton}`}
                onClick={handleShareClick}
                title="Share track"
              >
                <i className="fas fa-share-square" aria-hidden="true"></i>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.bottomStack}>
          <div className={styles.visualFooter}>
            <div className={styles.waveSection}>
              <div
                className={styles.wavePanel}
                ref={wavePanelRef}
                onClick={handleWaveformSeek}
                onMouseMove={handleWaveformHover}
                onMouseLeave={() => setHoverPercentage(null)}
                role="presentation"
              >
                <div className={styles.waveform}>
                  <canvas ref={waveCanvasRef} className={styles.waveCanvas} aria-hidden="true"></canvas>
                </div>

                <div className={styles.progressBarWrap}>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarHover}
                      style={{ width: formatPercent(hoverPercentage ?? 0), opacity: hoverPercentage === null ? 0 : 1 }}
                      aria-hidden="true"
                    ></div>
                    <div
                      className={styles.progressBarPlayed}
                      style={{ width: formatPercent(currentPercentage) }}
                      aria-hidden="true"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <span className={styles.privacyBadge}>Privacy policy</span>
            <span className={styles.timeBadge}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {showShareToast ? <div className={styles.toast}>Link copied to clipboard!</div> : null}
    </figure>
  );
}
