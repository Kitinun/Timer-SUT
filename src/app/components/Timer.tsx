"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ProgressRing from "./ProgressRing";
import PresetButtons from "./PresetButtons";
import Controls from "./Controls";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress (1 = full, 0 = empty)
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;

  // Get color based on progress
  const getProgressColor = () => {
    if (isFinished) return "#ef4444";
    if (progress > 0.5) return "#10b981";
    if (progress > 0.25) return "#f59e0b";
    return "#ef4444";
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
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playAlertSound();
            return 0;
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
  }, [isRunning, timeLeft, playAlertSound]);

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

  // Handlers
  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setHasStarted(true);
      setIsFinished(false);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
    setTimeLeft(totalTime);
  };

  const handleSelectTime = (seconds: number) => {
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
  };

  // Add/subtract time
  const handleAddTime = (seconds: number) => {
    const newTimeLeft = Math.max(0, timeLeft + seconds);
    const newTotalTime = Math.max(totalTime, newTimeLeft);
    setTimeLeft(newTimeLeft);
    setTotalTime(newTotalTime);
    if (isFinished && newTimeLeft > 0) {
      setIsFinished(false);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = async () => {
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
  };

  // Get status text
  const getStatusText = () => {
    if (isFinished) return "⏰ หมดเวลา!";
    if (isRunning) return "กำลังนับถอยหลัง...";
    if (hasStarted) return "หยุดชั่วคราว";
    return "พร้อมเริ่ม";
  };

  // Get status color class
  const getStatusColor = () => {
    if (isFinished) return "text-red-400";
    if (isRunning) {
      if (progress > 0.5) return "text-emerald-400";
      if (progress > 0.25) return "text-amber-400";
      return "text-red-400";
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
        className="relative flex flex-col items-center justify-center min-h-screen animated-bg overflow-hidden cursor-default select-none"
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

        {/* Top bar — size slider + exit button */}
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

        {/* ===== GIANT TIMER DISPLAY (auto-sized) ===== */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
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

          {/* Status text */}
          <div
            className={`mt-4 font-medium transition-colors duration-500 ${getStatusColor()}`}
            style={{ fontSize: `calc(${fontScale / 100} * 1.5rem)` }}
          >
            {getStatusText()}
          </div>
        </div>

        {/* ===== BOTTOM CONTROLS ===== */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
            showFsControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-16 pb-6 px-6">
            <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
              {/* Time Adjustment Buttons */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
                <button
                  id="btn-sub-5"
                  onClick={() => handleAddTime(-300)}
                  className="glass-btn text-sm px-3 py-2 text-red-300 border-red-400/20 hover:bg-red-400/10"
                >
                  -5 นาที
                </button>
                <button
                  id="btn-sub-1"
                  onClick={() => handleAddTime(-60)}
                  className="glass-btn text-sm px-3 py-2 text-red-300 border-red-400/20 hover:bg-red-400/10"
                >
                  -1 นาที
                </button>
                <button
                  id="btn-sub-30s"
                  onClick={() => handleAddTime(-30)}
                  className="glass-btn text-sm px-3 py-2 text-red-300 border-red-400/20 hover:bg-red-400/10"
                >
                  -30 วิ
                </button>

                <div className="w-px h-8 bg-white/10 mx-1" />

                <button
                  id="btn-add-30s"
                  onClick={() => handleAddTime(30)}
                  className="glass-btn text-sm px-3 py-2 text-emerald-300 border-emerald-400/20 hover:bg-emerald-400/10"
                >
                  +30 วิ
                </button>
                <button
                  id="btn-add-1"
                  onClick={() => handleAddTime(60)}
                  className="glass-btn text-sm px-3 py-2 text-emerald-300 border-emerald-400/20 hover:bg-emerald-400/10"
                >
                  +1 นาที
                </button>
                <button
                  id="btn-add-5"
                  onClick={() => handleAddTime(300)}
                  className="glass-btn text-sm px-3 py-2 text-emerald-300 border-emerald-400/20 hover:bg-emerald-400/10"
                >
                  +5 นาที
                </button>
              </div>

              {/* Play / Pause / Reset */}
              <Controls
                isRunning={isRunning}
                hasStarted={hasStarted}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== NORMAL RENDER =====================
  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-8 md:gap-10 w-full px-4"
    >
      <audio ref={audioRef} preload="auto" />

      {/* Fullscreen Toggle Button */}
      <button
        id="btn-fullscreen"
        onClick={handleToggleFullscreen}
        className="glass-btn flex items-center gap-2 text-sm absolute top-4 right-4 z-50 transition-all duration-300"
        title="เข้าสู่โหมดเต็มจอ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-7.94 0a.75.75 0 10-1.06-1.06L1.5 18.44v-2.69a.75.75 0 00-1.5 0v4.5a.75.75 0 00.75.75h4.5a.75.75 0 000-1.5H2.56l3.97-3.97z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">เต็มจอ</span>
      </button>

      {/* Title */}
      <div className="text-center animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-2">
          Presentation Timer
        </h1>
        <p className="text-white/40 text-sm md:text-base">
          จับเวลาการนำเสนอของคุณ
        </p>
      </div>

      {/* Timer Display */}
      <div className="relative animate-fade-in">
        <ProgressRing
          progress={progress}
          size={320}
          strokeWidth={8}
          isFinished={isFinished}
        >
          <span
            className={`text-6xl md:text-7xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${
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
        selectedTime={totalTime}
        isRunning={isRunning}
      />
    </div>
  );
}
