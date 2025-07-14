// tailwind.config.js
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",       // <— ativa dark mode por media query
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          rich: "#002f1f",
          dark: "#032221",
          bangladesh: "#02624C",
          meadow: "#29C285",
          caribbean: "#00D981",
        },
        secondary: {
          pine: "#063D28",
          basil: "#084F43",
          forest: "#095544",
          frog: "#179D60",
          mint: "#24B68C",
          stone: "#707070",
          pistachio: "#A6C1AC",
        },
      },
      fontFamily: {
        sans: ["Axiforma", "Helvetica", "Arial", "sans-serif"],
      },
      animation: {
        "pulse-sm": "pulse 1s ease-in-out 1",
        fadeIn: "fadeIn 0.5s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
