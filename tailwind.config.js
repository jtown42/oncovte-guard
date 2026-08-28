/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Ink" concept — a calm e-paper clinical note. Cool paper ground,
        // soft-charcoal ink, hairline rules, and ONE accent (pine = "go").
        // Structure carries the design; color is spent only on the verdict and
        // on genuine severity, mostly as small dots rather than filled chips.
        clinical: {
          bg: "#F3F5F4", // cool paper canvas
          panel: "#FBFCFB", // near-white raised surface
          border: "#D8DEDB", // a real, visible edge (soft)
          hairline: "#E7ECEA", // internal rules
          ink: "#1C2321", // soft charcoal — easier on eyes than pure black
          inkSoft: "#3A4742", // secondary text (8.9:1 on paper)
          muted: "#57645D", // tertiary / labels (5.7:1 on paper — AA)
          faint: "#647069", // captions / eyebrows / +0 rows (4.7:1 on paper — AA)
          brand: "#3A6B5C", // calm pine — interactive + "go"
          brandDark: "#2B5347",
          brandSoft: "#E9F0EC", // accent wash (verdict band)
          brandTint: "#F1F6F3",
        },
        // Semantic severity — deliberately desaturated for e-paper calm.
        // Reserve saturated presence for `danger` (a true stop signal).
        sev: {
          danger: "#A8443A", // muted brick
          dangerWash: "#F4E6E3",
          dangerInk: "#8A382F",
          caution: "#9A7318", // desaturated ochre (also covers "warning")
          cautionWash: "#F5EFDF",
          cautionInk: "#6F550F",
          ok: "#3A6B5C", // pine — same as brand
          okWash: "#E9F0EC",
          okInk: "#2B5347",
          info: "#42627A", // calm slate-blue
          infoWash: "#E9EEF1",
          infoInk: "#35566B",
          neutral: "#6B7772",
          neutralWash: "#EEF1F0",
        },
      },
      fontFamily: {
        // Serif display for the things you read (verdict, names, card titles);
        // humanist sans for UI; mono for data readouts (a quiet vitals monitor).
        serif: [
          "Newsreader",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "Hanken Grotesk",
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
        // Paper doesn't float. A near-invisible lift only, to separate a surface
        // from the canvas under projector washout.
        card: "0 1px 2px rgba(28,35,33,0.03)",
        cardhover: "0 1px 3px rgba(28,35,33,0.06)",
        hero: "0 1px 2px rgba(28,35,33,0.04)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};
