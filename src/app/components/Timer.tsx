"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ProgressRing from "./ProgressRing";
import PresetButtons from "./PresetButtons";
import Controls from "./Controls";
import AgendaSidebar from "./AgendaSidebar";

// Fullscreen API types for cross-browser support
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}
interface FullscreenHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

const DEFAULT_TIME = 300; // 5 minutes

export default function Timer() {
  const [totalTime, setTotalTime] = useState(DEFAULT_TIME);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [showFsControls, setShowFsControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [realTime, setRealTime] = useState<Date>(new Date());
  const [warningMins, setWarningMins] = useState(5);
  const [dangerMins, setDangerMins] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [prompterMessage, setPrompterMessage] = useState("");
  const [prompterInput, setPrompterInput] = useState("");
  const [isCountUp, setIsCountUp] = useState(false);
  const [fsCustomMins, setFsCustomMins] = useState("");
  const [fsCustomSecs, setFsCustomSecs] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Format seconds to MM:SS (supports negative for overtime)
  const formatTime = (seconds: number): string => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = isNegative ? "-" : "";
    return `${sign}${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress (1 = full, 0 = empty)
  const progress = isCountUp ? 0 : (totalTime > 0 ? timeLeft / totalTime : 0);

  // Get color based on progress and thresholds
  const getProgressColor = () => {
    if (isCountUp) return "#a67436"; // SUT Gold for count up
    if (isFinished) return "#ef4444"; // Red for finished
    const minutesLeft = timeLeft / 60;
    if (minutesLeft <= dangerMins) return "#ef4444"; // Red
    if (minutesLeft <= warningMins) return "#f26522"; // SUT Orange (Warning)
    return "#a67436"; // SUT Gold (Normal)
  };

  // Play alert sound
  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      const playBeep = (time: number, frequency: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        oscillator.start(time);
        oscillator.stop(time + duration);
      };

      const now = audioContext.currentTime;
      playBeep(now, 660, 0.3);
      playBeep(now + 0.35, 880, 0.3);
      playBeep(now + 0.7, 1100, 0.5);
    } catch {
      // Silently fail if audio is not supported
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (isCountUp) return prev + 1;
          
          if (prev === 1) {
            setIsFinished(true);
            if (!isMuted) playAlertSound();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, playAlertSound, isMuted, isCountUp]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) setShowFsControls(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-hide fullscreen controls after 4s of inactivity
  useEffect(() => {
    if (!isFullscreen) return;

    const resetHideTimer = () => {
      setShowFsControls(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = setTimeout(() => {
        setShowFsControls(false);
      }, 4000);
    };

    resetHideTimer();

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetHideTimer);
      container.addEventListener("touchstart", resetHideTimer);
      container.addEventListener("click", resetHideTimer);
    }

    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      if (container) {
        container.removeEventListener("mousemove", resetHideTimer);
        container.removeEventListener("touchstart", resetHideTimer);
        container.removeEventListener("click", resetHideTimer);
      }
    };
  }, [isFullscreen]);

  // Wake Lock API
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error('Wake Lock error:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRunning]);

  // Real-time clock effect
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Handlers
  const handleStart = useCallback(() => {
    if (timeLeft > 0 || isCountUp) {
      setIsRunning(true);
      setHasStarted(true);
      setIsFinished(false);
    }
  }, [timeLeft, isCountUp]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
    setTimeLeft(isCountUp ? 0 : totalTime);
  }, [totalTime, isCountUp]);

  const handleSelectTime = useCallback((seconds: number, title?: string) => {
    setIsCountUp(false);
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setCurrentSpeaker(title || null);
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
  }, []);

  const toggleCountUp = useCallback(() => {
    setIsCountUp((prev) => {
      const next = !prev;
      if (next) {
        setTimeLeft(0);
        setTotalTime(0);
        setIsFinished(false);
      } else {
        setTimeLeft(DEFAULT_TIME);
        setTotalTime(DEFAULT_TIME);
      }
      return next;
    });
    setIsRunning(false);
    setHasStarted(false);
  }, []);

  // Add/subtract time
  const handleAddTime = useCallback((seconds: number) => {
    const newTimeLeft = Math.max(0, timeLeft + seconds);
    const newTotalTime = Math.max(totalTime, newTimeLeft);
    setTimeLeft(newTimeLeft);
    setTotalTime(newTotalTime);
    if (isFinished && newTimeLeft > 0) {
      setIsFinished(false);
    }
  }, [timeLeft, totalTime, isFinished]);

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(async () => {
    try {
      const doc = document as FullscreenDocument;
      if (!isFullscreen) {
        const el = containerRef.current as FullscreenHTMLElement | null;
        if (el) {
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          }
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch {
      // Silently fail
    }
  }, [isFullscreen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsRunning((prev) => {
          if (!prev) setHasStarted(true);
          return !prev;
        });
      } else if (e.key.toLowerCase() === "r") {
        handleReset();
      } else if (e.key.toLowerCase() === "f") {
        handleToggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReset, handleToggleFullscreen]);

  // Get status text
  const getStatusText = () => {
    if (isFinished) return "⏰ หมดเวลา!";
    if (isRunning) return "กำลังนับถอยหลัง...";
    if (hasStarted) return "หยุดชั่วคราว";
    return "พร้อมเริ่ม";
  };

  // Get status color class
  const getStatusColor = () => {
    if (isCountUp) return "text-accent-gold";
    if (isFinished) return "text-red-400";
    if (isRunning) {
      const minutesLeft = timeLeft / 60;
      if (minutesLeft <= dangerMins) return "text-red-400";
      if (minutesLeft <= warningMins) return "text-primary-400"; // Orange
      return "text-accent-gold"; // Gold
    }
    return "text-white/40";
  };

  // Auto font size for fullscreen (viewport-responsive)
  const autoFontSize = `calc(${fontScale / 100} * min(30vw, 35vh))`;

  // ===================== FULLSCREEN RENDER =====================
  if (isFullscreen) {
    return (
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden cursor-default select-none"
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 w-full h-2 bg-white/5 z-40">
          <div
            className="h-full transition-all duration-1000 ease-linear rounded-r-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: getProgressColor(),
              boxShadow: `0 0 12px ${getProgressColor()}60`,
            }}
          />
        </div>

        {/* Top Center: Real-time Clock */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="text-white/30 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-widest font-mono">
            {realTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Logo Bottom */}
        {/* Top Controls (Hover to show) */}
        <div
          className={`absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-6 transition-opacity duration-500 ${
            showFsControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Size Slider */}
          <div className="flex items-center gap-3 glass-card px-4 py-2.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/40">
              <path fillRule="evenodd" d="M2 6.75A.75.75 0 012.75 6h18.5a.75.75 0 010 1.5H2.75A.75.75 0 012 6.75zM2 12a.75.75 0 01.75-.75h10a.75.75 0 010 1.5h-10A.75.75 0 012 12zm0 5.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
            <span className="text-white/40 text-xs font-medium whitespace-nowrap">ขนาด</span>
            <input
              id="font-scale-slider"
              type="range"
              min="40"
              max="180"
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="w-28 md:w-40 accent-primary-400 cursor-pointer"
            />
            <span className="text-white/50 text-xs tabular-nums w-10 text-right">{fontScale}%</span>
          </div>

          {/* Top Right Controls (Fullscreen) */}
          <div className="flex items-center gap-3">
            {/* Agenda Toggle Button */}
            <button
              id="btn-agenda-fs"
              onClick={() => setIsAgendaOpen(true)}
              className="glass-btn flex items-center gap-2 text-sm transition-all duration-300 px-3"
              title="ดูกำหนดการ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="hidden sm:inline">คิวงาน</span>
            </button>

            {/* Settings Toggle Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="glass-btn flex items-center justify-center p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300"
              title="ตั้งค่า"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Mute Toggle Button */}
            <button
              id="btn-mute-fs"
              onClick={() => setIsMuted(!isMuted)}
              className="glass-btn flex items-center justify-center p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300"
              title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
              )}
            </button>

            {/* Exit fullscreen */}
            <button
              id="btn-fullscreen-exit"
              onClick={handleToggleFullscreen}
              className="glass-btn flex items-center gap-2 text-sm"
              title="ออกจากโหมดเต็มจอ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.22 3.22a.75.75 0 011.06 0l3.97 3.97V4.5a.75.75 0 011.5 0V9a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h2.69L3.22 4.28a.75.75 0 010-1.06zm17.56 0a.75.75 0 010 1.06l-3.97 3.97H19.5a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75V4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0zM3.22 20.78a.75.75 0 010-1.06l3.97-3.97H4.5a.75.75 0 010-1.5H9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.97 3.97a.75.75 0 01-1.06 0zm17.56 0a.75.75 0 01-1.06 0l-3.97-3.97V19.5a.75.75 0 01-1.5 0V15a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-2.69l3.97 3.97a.75.75 0 010 1.06z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </div>

        {/* ===== GIANT TIMER DISPLAY (auto-sized) ===== */}
        <div 
          className={`flex flex-col items-center justify-center flex-1 w-full transition-all duration-500 ${
            showFsControls ? "pb-48" : "pb-0"
          }`}
        >
          {currentSpeaker && (
            <div className="text-accent-gold/80 font-medium mb-4 tracking-wide max-w-2xl text-center truncate px-6" style={{ fontSize: `calc(${fontScale / 100} * 1.5rem)` }}>
              กำลังบรรยาย: <span className="text-white">{currentSpeaker}</span>
            </div>
          )}
          <div
            className={`font-bold tabular-nums tracking-tighter leading-none transition-colors duration-500 ${
              isFinished ? "text-red-400 animate-blink" : "text-white"
            }`}
            style={{
              fontSize: autoFontSize,
              textShadow: `0 0 60px ${getProgressColor()}30`,
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Prompter Message Display */}
        {prompterMessage && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-5xl pointer-events-none animate-fade-in flex justify-center">
            <div className="bg-red-600/95 text-white text-3xl sm:text-4xl md:text-5xl font-bold py-5 px-10 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,1)] border-2 border-white/20 animate-pulse text-center tracking-wide">
              {prompterMessage}
            </div>
          </div>
        )}

        {/* ===== BOTTOM CONTROLS ===== */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
            showFsControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-4 w-full">
            <div className="flex flex-col items-center gap-2 max-w-7xl mx-auto w-full">
              
              {/* Row 1: Time Adjustments & Custom Time & Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/10">
                
                {/* Controls (Play/Pause/Reset) */}
                <div className="scale-90 sm:scale-100 origin-center shrink-0">
                  <Controls
                    isRunning={isRunning}
                    hasStarted={hasStarted}
                    onStart={handleStart}
                    onPause={handlePause}
                    onReset={handleReset}
                  />
                </div>

                <div className="w-px h-6 bg-white/10 hidden md:block" />
                
                {/* Add/Subtract Time Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleAddTime(-300)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-red-300 border-red-400/20 hover:bg-red-400/10">-5m</button>
                  <button onClick={() => handleAddTime(-60)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-red-300 border-red-400/20 hover:bg-red-400/10">-1m</button>
                  <button onClick={() => handleAddTime(-30)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-red-300 border-red-400/20 hover:bg-red-400/10">-30s</button>
                  <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
                  <button onClick={() => handleAddTime(30)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-accent-gold border-accent-gold/20 hover:bg-accent-gold/10">+30s</button>
                  <button onClick={() => handleAddTime(60)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-accent-gold border-accent-gold/20 hover:bg-accent-gold/10">+1m</button>
                  <button onClick={() => handleAddTime(300)} className="glass-btn text-xs sm:text-sm px-2 py-1.5 text-accent-gold border-accent-gold/20 hover:bg-accent-gold/10">+5m</button>
                </div>

                <div className="w-px h-6 bg-white/10 hidden lg:block" />

                {/* Mode Toggle & Custom Time */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={toggleCountUp}
                    className={`glass-btn text-xs sm:text-sm px-3 py-1.5 flex items-center gap-1 ${isCountUp ? "bg-accent-gold/20 text-accent-gold border-accent-gold/50" : "text-white/50 border-white/10"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">{isCountUp ? "เดินหน้า" : "ถอยหลัง"}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/10">
                    <input
                      type="number"
                      min="0"
                      value={fsCustomMins}
                      onChange={(e) => setFsCustomMins(e.target.value)}
                      placeholder="นาที"
                      className="w-14 bg-transparent text-center text-sm text-white focus:outline-none"
                    />
                    <span className="text-white/50 text-xs">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={fsCustomSecs}
                      onChange={(e) => setFsCustomSecs(e.target.value)}
                      placeholder="วิ"
                      className="w-12 bg-transparent text-center text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const mins = parseInt(fsCustomMins, 10) || 0;
                        const secs = parseInt(fsCustomSecs, 10) || 0;
                        const totalSeconds = mins * 60 + secs;
                        if (totalSeconds > 0) {
                          handleSelectTime(totalSeconds);
                          setFsCustomMins("");
                          setFsCustomSecs("");
                        }
                      }}
                      className="text-xs bg-accent-gold hover:bg-accent-gold/80 text-[#0a0502] font-semibold px-3 py-1.5 rounded transition-colors whitespace-nowrap ml-1"
                    >
                      ตั้งเวลา
                    </button>
                  </div>
                </div>

              </div>

              {/* Row 2: Prompter Input & Inline Footer */}
              <div className="flex flex-col md:flex-row items-center justify-between w-full gap-2">
                
                {/* Fullscreen Prompter Input */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-2 px-4 border border-white/10 flex-1 w-full max-w-4xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-400 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span className="text-white/60 text-xs sm:text-sm whitespace-nowrap hidden sm:inline shrink-0">ข้อความด่วน:</span>
                  <input
                    type="text"
                    value={prompterInput}
                    onChange={(e) => setPrompterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPrompterMessage(prompterInput);
                      }
                    }}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[150px]"
                  />
                  <button
                    onClick={() => setPrompterMessage(prompterInput)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded transition-colors text-xs sm:text-sm whitespace-nowrap shrink-0"
                  >
                    ส่งข้อความ
                  </button>
                  {prompterMessage && (
                    <button
                      onClick={() => {
                        setPrompterMessage("");
                        setPrompterInput("");
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded transition-colors text-xs sm:text-sm whitespace-nowrap shrink-0"
                    >
                      ล้างจอ
                    </button>
                  )}
                </div>

                {/* Footer in Fullscreen (Inline, Compact) */}
                <div className="text-right opacity-80 pointer-events-none hidden md:block shrink-0 pl-4">
                  <p className="text-accent-gold/90 font-medium text-xs tracking-wider mb-0.5 drop-shadow-md">
                    พัฒนาโดย สถานส่งเสริมและพัฒนาระบบสารสนเทศเพื่อการจัดการ (สพส.)
                  </p>
                  <p className="text-white/70 text-[10px] tracking-wide">
                    Management Information System Development Unit (MIS)
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Agenda Sidebar (Fullscreen) */}
        <AgendaSidebar
          isOpen={isAgendaOpen}
          onClose={() => setIsAgendaOpen(false)}
          onLoadItem={handleSelectTime}
        />
      </div>
    );
  }

  // ===================== NORMAL RENDER =====================
  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-4 md:gap-6 w-full px-4"
    >
      <audio ref={audioRef} preload="auto" />

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {/* Agenda Toggle Button */}
        <button
          id="btn-agenda"
          onClick={() => setIsAgendaOpen(true)}
          className="glass-btn flex items-center gap-2 text-sm transition-all duration-300 px-3"
          title="ดูกำหนดการ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="hidden sm:inline">คิวงาน</span>
        </button>

        {/* Mute Toggle Button */}
        <button
          id="btn-mute"
          onClick={() => setIsMuted(!isMuted)}
          className="glass-btn flex items-center justify-center p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300"
          title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
            </svg>
          )}
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          id="btn-fullscreen"
          onClick={handleToggleFullscreen}
          className="glass-btn flex items-center gap-2 text-sm transition-all duration-300"
          title="เข้าสู่โหมดเต็มจอ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-7.94 0a.75.75 0 10-1.06-1.06L1.5 18.44v-2.69a.75.75 0 00-1.5 0v4.5a.75.75 0 00.75.75h4.5a.75.75 0 000-1.5H2.56l3.97-3.97z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">เต็มจอ</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center animate-fade-in flex flex-col items-center">
        <Image 
          src="/image/sut-logo.png" 
          alt="SUT Logo" 
          width={60} 
          height={60} 
          className="mb-2 drop-shadow-[0_0_15px_rgba(166,116,54,0.3)]" 
        />
        <div className="bg-accent-gold/20 text-accent-gold border border-accent-gold/30 px-3 py-1 rounded-full text-xs font-semibold tracking-widest mb-2 flex items-center gap-2 shadow-[0_0_15px_rgba(166,116,54,0.3)]">
          <span>SURANAREE UNIVERSITY OF TECHNOLOGY</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gradient mb-1">
          Presentation Timer
        </h1>
        <p className="text-white/40 text-xs md:text-sm">
          จับเวลาการนำเสนอของคุณ
        </p>
      </div>

      {/* Timer Display */}
      <div className="relative animate-fade-in">
        <ProgressRing
          progress={progress}
          size={260}
          strokeWidth={8}
          isFinished={isFinished}
        >
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${
              isFinished ? "text-red-400 animate-blink" : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <span
            className={`text-sm md:text-base mt-2 font-medium transition-colors duration-500 ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </ProgressRing>
      </div>

      {/* Controls */}
      <Controls
        isRunning={isRunning}
        hasStarted={hasStarted}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />

      {/* Preset Buttons */}
      <PresetButtons
        onSelectTime={handleSelectTime}
        selectedTime={!isRunning && !hasStarted ? totalTime : -1}
        isRunning={isRunning}
      />

      {/* Agenda Sidebar */}
      <AgendaSidebar
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        onLoadItem={handleSelectTime}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-[#120a05] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ตั้งค่าการแจ้งเตือน
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary-400 mb-2 font-medium">เตือนสีส้ม (Warning) เมื่อเหลือ</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={warningMins} onChange={(e) => setWarningMins(Number(e.target.value))} className="w-full bg-black/50 border border-primary-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-400" />
                  <span className="text-white/50 text-sm">นาที</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-red-400 mb-2 font-medium">เตือนสีแดง (Danger) เมื่อเหลือ</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={dangerMins} onChange={(e) => setDangerMins(Number(e.target.value))} className="w-full bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-400" />
                  <span className="text-white/50 text-sm">นาที</span>
                </div>
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="mt-8 w-full bg-accent-gold hover:bg-accent-gold/90 text-[#0a0502] font-semibold py-2.5 rounded-lg transition-colors">
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
