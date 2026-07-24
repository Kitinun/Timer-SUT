"use client";

import React from "react";

interface ProgressRingProps {
  /** Value between 0 and 1 representing progress remaining */
  progress: number;
  /** Size of the ring in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Children to render inside the ring (e.g., time display) */
  children?: React.ReactNode;
  /** Whether the timer has finished */
  isFinished?: boolean;
}

export default function ProgressRing({
  progress,
  size = 320,
  strokeWidth = 8,
  children,
  isFinished = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color based on progress
  const getColor = () => {
    if (isFinished) return { stroke: "#ef4444", glow: "glow-red" };
    if (progress > 0.5) return { stroke: "#a67436", glow: "glow-gold" };
    if (progress > 0.25) return { stroke: "#f26522", glow: "glow-orange" };
    return { stroke: "#ef4444", glow: "glow-red" };
  };

  const color = getColor();

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={`-rotate-90 transition-all duration-500 ${color.glow} ${
          isFinished ? "animate-blink" : ""
        }`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id="progress-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color.stroke} />
            <stop
              offset="100%"
              stopColor={color.stroke}
              stopOpacity="0.6"
            />
          </linearGradient>
        </defs>
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
        {/* Glow dot at the end of the progress */}
        {progress > 0 && progress < 1 && !isFinished && (
          <circle
            cx={
              size / 2 +
              radius * Math.cos(2 * Math.PI * progress - Math.PI / 2)
            }
            cy={
              size / 2 +
              radius * Math.sin(2 * Math.PI * progress - Math.PI / 2)
            }
            r={strokeWidth / 2 + 2}
            fill={color.stroke}
            className="animate-pulse"
            style={{
              filter: `drop-shadow(0 0 6px ${color.stroke})`,
            }}
          />
        )}
      </svg>
      {/* Content inside the ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
