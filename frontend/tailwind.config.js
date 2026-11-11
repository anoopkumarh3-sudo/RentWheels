/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#630ed4",
        "primary-container": "#7c3aed",
        "on-primary": "#ffffff",
        "on-primary-container": "#ede0ff",
        "primary-fixed": "#eaddff",
        "primary-fixed-dim": "#d2bbff",
        "on-primary-fixed": "#25005a",
        "on-primary-fixed-variant": "#5a00c6",
        "inverse-primary": "#d2bbff",

        "secondary": "#5f5a7c",
        "secondary-container": "#dcd5fd",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#605b7d",
        "secondary-fixed": "#e5deff",
        "secondary-fixed-dim": "#c8c2e9",
        "on-secondary-fixed": "#1b1735",
        "on-secondary-fixed-variant": "#474363",

        "tertiary": "#56476f",
        "tertiary-container": "#6f5f89",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#eee0ff",
        "tertiary-fixed": "#ecdcff",
        "tertiary-fixed-dim": "#d1beee",
        "on-tertiary-fixed": "#221439",
        "on-tertiary-fixed-variant": "#4e4067",

        "surface": "#fcf8ff",
        "surface-dim": "#dcd8e5",
        "surface-bright": "#fcf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f1ff",
        "surface-container": "#f0ecf9",
        "surface-container-high": "#ebe6f4",
        "surface-container-highest": "#e5e0ee",
        "on-surface": "#1c1a24",
        "on-surface-variant": "#4a4455",
        "inverse-surface": "#312f39",
        "inverse-on-surface": "#f3effc",
        "surface-tint": "#732ee4",
        "surface-variant": "#e5e0ee",

        "background": "#fcf8ff",
        "on-background": "#1c1a24",

        "outline": "#7b7487",
        "outline-variant": "#ccc3d8",

        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        "status-alert": "#E11D48",
        "status-success": "#10B981",

        "electric-violet-hover": "#6D28D9",
        "electric-violet-bright": "#8B5CF6",
        "lavender-subtle": "#EDE9FE",
        "surface-canvas": "#F8FAFC",
        "surface-card": "#FFFFFF",
        "border-purple-tint": "#E9E5F5",
        "border-subtle": "#E2E8F0"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        heading: ["'Plus Jakarta Sans'", "sans-serif"]
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        "gutter-sm": "1rem",
        "gutter": "1.5rem",
        "margin-sm": "1rem",
        "margin": "2rem",
        "margin-lg": "4rem",
      }
    },
  },
  plugins: [],
}

