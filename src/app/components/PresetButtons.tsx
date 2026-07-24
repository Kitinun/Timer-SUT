"use client";

import React, { useState } from "react";

interface PresetButtonsProps {
  onSelectTime: (seconds: number) => void;
  selectedTime: number;
  isRunning: boolean;
}

const PRESETS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
];

export default function PresetButtons({
  onSelectTime,
  selectedTime,
  isRunning,
}: PresetButtonsProps) {
  const [customMinutes, setCustomMinutes] = useState("");
  const [customSeconds, setCustomSeconds] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalSeconds = mins * 60 + secs;
    if (totalSeconds > 0) {
      onSelectTime(totalSeconds);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-slide-up w-full max-w-2xl">
      {/* Section Title */}
      <h2 className="text-sm md:text-base font-semibold text-white/50 uppercase tracking-widest mb-5 text-center">
        ⏱ ตั้งเวลา
      </h2>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {PRESETS.map((preset) => (
          <button
            key={preset.seconds}
            id={`preset-${preset.seconds}`}
            onClick={() => onSelectTime(preset.seconds)}
            disabled={isRunning}
            className={`preset-btn ${
              selectedTime === preset.seconds ? "active" : ""
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Time Input */}
      <form
        onSubmit={handleCustomSubmit}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <span className="text-white/40 text-sm font-medium shrink-0">
          กำหนดเอง:
        </span>
        <div className="flex items-center gap-2">
          <input
            id="custom-minutes"
            type="number"
            min="0"
            max="999"
            placeholder="นาที"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            disabled={isRunning}
            className={"w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-white placeholder-white/30 backdrop-blur-md outline-none transition-all focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed"}
          />
          <span className="text-white/30 text-lg font-light">:</span>
          <input
            id="custom-seconds"
            type="number"
            min="0"
            max="59"
            placeholder="วินาที"
            value={customSeconds}
            onChange={(e) => setCustomSeconds(e.target.value)}
            disabled={isRunning}
            className={"w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-white placeholder-white/30 backdrop-blur-md outline-none transition-all focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed"}
          />
        </div>
        <button
          id="custom-time-submit"
          type="submit"
          disabled={isRunning}
          className="glass-btn text-sm px-5 py-2.5 bg-primary-400/10 border-primary-400/30 text-primary-200 hover:bg-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ตั้งเวลา
        </button>
      </form>
    </div>
  );
}
