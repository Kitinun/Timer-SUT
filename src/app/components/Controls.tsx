"use client";

import React from "react";

interface ControlsProps {
  isRunning: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function Controls({
  isRunning,
  hasStarted,
  onStart,
  onPause,
  onReset,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      {/* Start / Pause Button */}
      {!isRunning ? (
        <button
          id="btn-start"
          onClick={onStart}
          className="control-btn-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            {hasStarted ? (
              // Resume icon
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            ) : (
              // Play icon
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {hasStarted ? "ดำเนินการต่อ" : "เริ่ม"}
        </button>
      ) : (
        <button
          id="btn-pause"
          onClick={onPause}
          className="control-btn-pause"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
              clipRule="evenodd"
            />
          </svg>
          หยุดชั่วคราว
        </button>
      )}

      {/* Reset Button */}
      <button
        id="btn-reset"
        onClick={onReset}
        className="control-btn-reset"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
          />
        </svg>
        รีเซ็ต
      </button>
    </div>
  );
}
