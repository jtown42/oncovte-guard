/**
 * Presentation helpers: map clinical enums to human-readable labels and Tailwind
 * class strings. Keeping this in one place keeps the components declarative and
 * guarantees consistent severity color-coding across the dashboard, the DDI
 * matrix, and the CDS-style alerts.
 */

import type { DDISeverity } from "../types/ddi";
import type { OverallAction } from "../types/recommendation";
import type { RenalRecommendationStatus, CrclCategory } from "../types/renal";
import { RiskCategory } from "../types/khorana";

/** Semantic tone shared by pills, banners, and bars. */
export type Tone = "danger" | "warning" | "caution" | "good" | "neutral" | "info";

// Quiet chips: a faint hue wash, hue-ink text, and a hairline ring in the same
// hue. Severity reads without a saturated fill — the paired dot does the rest.
export const TONE_PILL: Record<Tone, string> = {
  danger: "bg-sev-dangerWash text-sev-dangerInk ring-1 ring-inset ring-sev-danger/20",
  warning: "bg-sev-cautionWash text-sev-cautionInk ring-1 ring-inset ring-sev-caution/20",
  caution: "bg-sev-cautionWash text-sev-cautionInk ring-1 ring-inset ring-sev-caution/20",
  good: "bg-sev-okWash text-sev-okInk ring-1 ring-inset ring-sev-ok/20",
  neutral: "bg-sev-neutralWash text-clinical-inkSoft ring-1 ring-inset ring-clinical-border",
  info: "bg-sev-infoWash text-sev-infoInk ring-1 ring-inset ring-sev-info/20",
};

export const TONE_BANNER: Record<Tone, string> = {
  danger: "border-sev-danger/40 bg-sev-dangerWash text-sev-dangerInk",
  warning: "border-sev-caution/40 bg-sev-cautionWash text-sev-cautionInk",
  caution: "border-sev-caution/40 bg-sev-cautionWash text-sev-cautionInk",
  good: "border-clinical-brand/40 bg-clinical-brandSoft text-clinical-brandDark",
  neutral: "border-clinical-border bg-clinical-bg text-clinical-inkSoft",
  info: "border-sev-info/40 bg-sev-infoWash text-sev-infoInk",
};

export const TONE_DOT: Record<Tone, string> = {
  danger: "bg-sev-danger",
  warning: "bg-sev-caution",
  caution: "bg-sev-caution",
  good: "bg-sev-ok",
  neutral: "bg-clinical-faint",
  info: "bg-sev-info",
};

/** Solid fills for icon badges (white glyph on a desaturated tone). */
export const TONE_SOLID: Record<Tone, string> = {
  danger: "bg-sev-danger",
  warning: "bg-sev-caution",
  caution: "bg-sev-caution",
  good: "bg-clinical-brand",
  neutral: "bg-clinical-muted",
  info: "bg-sev-info",
};

/* ---------- DDI severity ---------- */

export const SEVERITY_LABEL: Record<DDISeverity, string> = {
  major: "Major",
  moderate: "Moderate",
  pharmacodynamic: "Additive bleeding",
  minor: "Minor",
  none: "No interaction",
  unknown: "Unknown",
};

export function severityTone(s: DDISeverity): Tone {
  switch (s) {
    case "major":
      return "danger";
    case "moderate":
      return "warning";
    case "pharmacodynamic":
      return "warning";
    case "minor":
      return "caution";
    case "none":
      return "good";
    case "unknown":
      return "neutral";
  }
}

/** Short cell label for the dense DDI matrix. */
export const SEVERITY_CELL: Record<DDISeverity, string> = {
  major: "Major",
  moderate: "Mod",
  pharmacodynamic: "Bleed",
  minor: "Minor",
  none: "—",
  unknown: "?",
};

/* ---------- Overall action ---------- */

export interface ActionPresentation {
  label: string;
  tone: Tone;
  summary: string;
}

export const ACTION: Record<OverallAction, ActionPresentation> = {
  recommend: {
    label: "Prophylaxis recommended",
    tone: "good",
    summary:
      "Khorana score meets the NCCN threshold and at least one anticoagulant is appropriate.",
  },
  caution: {
    label: "Recommended with cautions",
    tone: "warning",
    summary:
      "Prophylaxis is indicated, but relative cautions or limited options require review.",
  },
  contraindicated: {
    label: "Anticoagulation contraindicated",
    tone: "danger",
    summary:
      "An absolute contraindication precludes pharmacologic prophylaxis at this time.",
  },
  not_indicated: {
    label: "Routine prophylaxis not indicated",
    tone: "neutral",
    summary:
      "Khorana score is below the NCCN threshold for routine ambulatory prophylaxis.",
  },
  excluded: {
    label: "Khorana not applicable",
    tone: "info",
    summary:
      "This malignancy follows a disease-specific VTE pathway; individualized assessment required.",
  },
};

/* ---------- Renal ---------- */

export function renalStatusTone(s: RenalRecommendationStatus): Tone {
  switch (s) {
    case "standard":
      return "good";
    case "caution":
      return "warning";
    case "avoid":
      return "danger";
  }
}

export const RENAL_STATUS_LABEL: Record<RenalRecommendationStatus, string> = {
  standard: "Standard",
  caution: "Caution",
  avoid: "Avoid",
};

export function crclTone(c: CrclCategory): Tone {
  switch (c) {
    case "normal":
      return "good";
    case "mild":
      return "good";
    case "moderate":
      return "warning";
    case "severe":
      return "danger";
  }
}

/* Spelled out. The arrow was doing the work of the word "reduced", and a
   glyph that small disappears on a projector. */
export const CRCL_LABEL: Record<CrclCategory, string> = {
  normal: "Normal (90 and above)",
  mild: "Mildly reduced (60 to 89)",
  moderate: "Moderately reduced (30 to 59)",
  severe: "Severely reduced (under 30)",
};

/* ---------- Khorana risk tier ---------- */

export function riskTone(r: RiskCategory): Tone {
  switch (r) {
    case RiskCategory.LOW:
      return "good";
    case RiskCategory.INTERMEDIATE:
      return "warning";
    case RiskCategory.HIGH:
      return "danger";
  }
}

export const RISK_LABEL: Record<RiskCategory, string> = {
  [RiskCategory.LOW]: "Low",
  [RiskCategory.INTERMEDIATE]: "Intermediate",
  [RiskCategory.HIGH]: "High",
};

/* ---------- Alert level ---------- */

export function alertTone(level: "critical" | "warning" | "info"): Tone {
  if (level === "critical") return "danger";
  if (level === "warning") return "warning";
  return "info";
}

/** Pretty-print a snake_case reason/field for display. */
export function humanize(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
