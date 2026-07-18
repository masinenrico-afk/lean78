import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07080c",
        panel: "#11131a",
        panelSoft: "#191c25",
        line: "#2a2e3b",
        accent: "#B8FF00",
        neon: "#B8FF00",
        mint: "#B8FF00",
        lime: "#B8FF00",
        coral: "#ff6b5f",
        gold: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 40px rgba(184, 255, 0, 0.14)",
        neon: "0 0 30px rgba(184, 255, 0, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
