import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      colors: {
        bg: "hsl(var(--color-bg))",
        surface: "hsl(var(--color-surface))",
        text: "hsl(var(--color-text))",
        muted: "hsl(var(--color-muted))",
        border: "hsl(var(--color-border))",
        primary: "hsl(var(--color-primary))",
        accent: "hsl(var(--color-accent))",
        danger: "hsl(var(--color-danger))",
        warning: "hsl(var(--color-warning))",
        info: "hsl(var(--color-info))"
      },
      boxShadow: {
        soft: "0 10px 30px -20px hsl(var(--color-text) / 0.3)"
      }
    }
  },
  plugins: []
};

export default config;
