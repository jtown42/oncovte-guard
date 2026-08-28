# Accessibility — measured contrast audit (WS-8 · "Ink" theme)

**Scope:** WCAG 2.1 AA contrast for all text/background colour pairs used across the five
terminal decision states and presentation mode, on the **"Ink" e-paper theme** (cool paper
ground, soft-charcoal ink, pine accent). **Method:** relative-luminance contrast ratio per
the WCAG 2.1 formula, computed directly from the palette hex values in `tailwind.config.js`.
Thresholds: **4.5:1** for normal text, **3:1** for large text (≥18.66px bold or ≥24px).

**Reproduce:** the ratios below come from the WCAG relative-luminance formula applied to the
`clinical.*` and `sev.*` tokens in `tailwind.config.js`. Each pair is `foreground on background`.

## Results — all pairs PASS AA (normal text, ≥4.5:1)

| Pair (foreground on background) | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---:|:--:|:--:|
| ink `#1C2321` on panel `#FBFCFB` (body) | 15.57 | ✅ | ✅ |
| ink on paper `#F3F5F4` (canvas) | 14.62 | ✅ | ✅ |
| inkSoft `#3A4742` on paper (secondary text) | 8.88 | ✅ | ✅ |
| muted `#57645D` on paper (labels) | 5.66 | ✅ | ✅ |
| muted on panel | 6.03 | ✅ | ✅ |
| muted on brandSoft `#E9F0EC` (verdict-band captions) | 5.36 | ✅ | ✅ |
| faint `#647069` on panel (eyebrows / captions) | 5.02 | ✅ | ✅ |
| faint on paper | 4.72 | ✅ | ✅ |
| brand/pine `#3A6B5C` on panel (interactive affordances) | 5.94 | ✅ | ✅ |
| white on brand (buttons, verdict mark) | 6.11 | ✅ | ✅ |
| brandDark `#2B5347` on brandSoft `#E9F0EC` (recommend verdict) | 7.46 | ✅ | ✅ |
| okInk `#2B5347` on okWash `#E9F0EC` (bleeding "standard") | 7.46 | ✅ | ✅ |
| cautionInk `#6F550F` on cautionWash `#F5EFDF` (caution body) | 6.13 | ✅ | ✅ |
| dangerInk `#8A382F` on dangerWash `#F4E6E3` (contraindication body) | 6.43 | ✅ | ✅ |
| danger `#A8443A` on dangerWash (absolute heading) | 4.86 | ✅ | ✅ |
| infoInk `#35566B` on infoWash `#E9EEF1` (excluded / info) | 6.67 | ✅ | ✅ |

**Tightest margin:** faint `#647069` on the paper canvas (4.72:1) — used for the small
section eyebrows and captions. It clears 4.5:1; it is the pair to watch if the paper ground
is ever darkened. `muted #57645D` (5.66:1 on paper) is the drop-in if more headroom is wanted.

**Design note:** severity is carried primarily by small **dots** (a colored disc beside
ink-toned text) rather than by saturated filled chips. Dots are non-text graphics; the
adjacent label always meets the text thresholds above, so meaning never rests on colour alone.

## What this audit does and does not cover

- **Covers:** colour contrast of every semantic text/background pair, in both normal and
  presentation (large-type) modes — presentation mode only *increases* effective ratios by
  enlarging text into the "large" threshold.
- **Does NOT cover (still open, honest):** screen-reader / ARIA traversal, keyboard-only
  navigation of the DDI modal and what-if rail, focus-visible states, and reflow at 400%
  zoom. These are declared unevaluated in `MASTER-DOCUMENT.md` §11.3 and remain so.
