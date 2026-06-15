/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clinical severity palette (semantic, WCAG-AA contrast on white).
        clinical: {
          bg: "#eef2f7",
          panel: "#ffffff",
          border: "#e3e9f2",
          hairline: "#eef2f7",
          ink: "#0e1b2a",
          muted: "#5b6b7a",
          brand: "#0b6e99", // teal-blue — calm, clinical
          brandDark: "#075066",
          brandSoft: "#e7f1f6",
          brandTint: "#f2f8fb",
        },
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,27,42,0.04), 0 6px 20px -12px rgba(14,27,42,0.18)",
        cardhover: "0 2px 4px rgba(14,27,42,0.05), 0 12px 28px -14px rgba(14,27,42,0.22)",
        hero: "0 10px 40px -18px rgba(11,110,153,0.45)",
      },
    },
  },
  plugins: [],
};
