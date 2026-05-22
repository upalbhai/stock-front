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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        bg: "hsl(var(--color-bg))",
        surface: "hsl(var(--color-surface))",
        text: "hsl(var(--color-text))",
        muted: "hsl(var(--color-muted))",
        border: "hsl(var(--color-border))",
        primary: "hsl(var(--color-primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        accent: "hsl(var(--color-accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        danger: "hsl(var(--color-danger))",
        warning: "hsl(var(--color-warning))",
        info: "hsl(var(--color-info))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))"
      },
      boxShadow: {
        soft: "0 10px 30px -20px hsl(var(--color-text) / 0.3)"
      }
    }
  },
  plugins: []
};

export default config;
