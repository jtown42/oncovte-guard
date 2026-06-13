/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clinical severity palette (semantic, WCAG-AA contrast on white).
        clinical: {
          bg: "#f6f8fb",
          panel: "#ffffff",
          border: "#e2e8f0",
          ink: "#0f172a",
          muted: "#64748b",
          brand: "#0b6e99", // teal-blue — calm, clinical
          brandDark: "#075066",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
