# Accessibility — measured contrast audit (WS-8)

**Scope:** WCAG 2.1 AA contrast for all text/background colour pairs used across the five
terminal decision states and presentation mode. **Method:** relative-luminance contrast
ratio per the WCAG 2.1 formula, computed directly from the palette hex values in
`tailwind.config.js` and the Tailwind default tones used in components. Thresholds: **4.5:1**
for normal text, **3:1** for large text (≥18.66px bold or ≥24px).

**Reproduce:** the ratios below are produced by the script in this file's git history / the
`docs` audit step; each pair is `foreground on background`.

## Results — all pairs PASS AA

| Pair (foreground on background) | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---:|:--:|:--:|
| ink `#0f172a` on white `#ffffff` (body) | 17.85 | ✅ | ✅ |
| ink on canvas `#f8fafc` | 17.06 | ✅ | ✅ |
| muted `#64748b` (slate-500) on white | 4.76 | ✅ | ✅ |
| muted on canvas `#f8fafc` | 4.55 | ✅ | ✅ |
| muted on amber-50 `#fffbeb` | 4.59 | ✅ | ✅ |
| brand `#0369a1` (sky-700) on white | 5.93 | ✅ | ✅ |
| white on brand (buttons) | 5.93 | ✅ | ✅ |
| amber-900 `#78350f` on amber-50 (alert body) | 8.75 | ✅ | ✅ |
| amber-800 `#92400e` on amber-50 (stale-lab) | 6.84 | ✅ | ✅ |
| amber-700 `#b45309` on amber-50 (source / "LMWH preferred") | 4.84 | ✅ | ✅ |
| emerald-900 `#064e3b` on emerald-50 (bleeding "standard") | 9.23 | ✅ | ✅ |
| emerald-700 `#047857` on white (recommend verdict) | 5.48 | ✅ | ✅ |
| rose-700 `#be123c` on white (avoid heading) | 6.29 | ✅ | ✅ |
| sky-900 `#0c4a6e` on sky-50 (excluded note) | 8.87 | ✅ | ✅ |

**Tightest margin:** slate-500 muted text on the slate-50 canvas (4.55:1) — it clears 4.5:1,
but it is the pair to watch if the canvas is ever darkened. slate-600 `#475569` (7.24:1 on
canvas) is the drop-in if more headroom is ever wanted.

## What this audit does and does not cover

- **Covers:** colour contrast of every semantic text/background pair, in both normal and
  presentation (large-type) modes — presentation mode only *increases* effective ratios by
  enlarging text into the "large" threshold.
- **Does NOT cover (still open, honest):** screen-reader / ARIA traversal, keyboard-only
  navigation of the DDI modal and what-if rail, focus-visible states, and reflow at 400%
  zoom. These are declared unevaluated in `MASTER-DOCUMENT.md` §11.3 and remain so.
