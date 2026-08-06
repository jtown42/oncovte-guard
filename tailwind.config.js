/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clinical severity palette (semantic, WCAG-AA contrast on white).
        // Structure carries the design, not color: a near-white canvas, white
        // panels, and a visible 1px border. Color is reserved for the five
        // terminal decision states so a verdict is the only thing that shouts.
        clinical: {
          bg: "#f8fafc", // slate-50 canvas
          panel: "#ffffff",
          border: "#d1d5db", // gray-300 — a real, visible edge
          hairline: "#e5e7eb", // gray-200 — internal rules
          ink: "#0f172a", // slate-900
          muted: "#64748b", // slate-500
          brand: "#0369a1", // sky-700 — interactive affordances only
          brandDark: "#075985",
          brandSoft: "#e0f2fe",
          brandTint: "#f0f9ff",
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
        // Structure over style: panels are defined by their border, not by a
        // floating drop shadow. `card` is a hairline lift only — enough to
        // separate a surface from the canvas under projector washout.
        card: "0 1px 1px rgba(15,23,42,0.03)",
        cardhover: "0 1px 2px rgba(15,23,42,0.06)",
        hero: "0 1px 2px rgba(15,23,42,0.05)",
      },
    },
  },
  plugins: [],
};
