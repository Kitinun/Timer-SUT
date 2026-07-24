import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f0e7ff",
          100: "#d4bcff",
          200: "#b78eff",
          300: "#9a5eff",
          400: "#8338ff",
          500: "#6d1fff",
          600: "#5a0fd9",
          700: "#4600b3",
          800: "#33008c",
          900: "#210066",
        },
        accent: {
          cyan: "#00f5d4",
          pink: "#f72585",
          blue: "#3a86ff",
          orange: "#fb5607",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "ring-pulse": "ring-pulse 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "blink": "blink 1s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(131, 56, 255, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(131, 56, 255, 0.6)" },
        },
        "ring-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundSize: {
        "400": "400% 400%",
      },
    },
  },
  plugins: [],
};
export default config;
