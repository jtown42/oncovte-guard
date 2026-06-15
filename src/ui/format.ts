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

export const TONE_PILL: Record<Tone, string> = {
  danger: "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  caution: "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200",
  good: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  info: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200",
};

export const TONE_BANNER: Record<Tone, string> = {
  danger: "border-rose-300 bg-rose-50 text-rose-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  caution: "border-yellow-300 bg-yellow-50 text-yellow-900",
  good: "border-emerald-300 bg-emerald-50 text-emerald-900",
  neutral: "border-slate-300 bg-slate-50 text-slate-800",
  info: "border-sky-300 bg-sky-50 text-sky-900",
};

export const TONE_DOT: Record<Tone, string> = {
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  caution: "bg-yellow-500",
  good: "bg-emerald-500",
  neutral: "bg-slate-400",
  info: "bg-sky-500",
};

/** Solid fills for icon badges (white glyph on a saturated tone). */
export const TONE_SOLID: Record<Tone, string> = {
  danger: "bg-rose-600",
  warning: "bg-amber-500",
  caution: "bg-yellow-500",
  good: "bg-emerald-600",
  neutral: "bg-slate-500",
  info: "bg-sky-600",
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

export const CRCL_LABEL: Record<CrclCategory, string> = {
  normal: "Normal (≥90)",
  mild: "Mild ↓ (60–89)",
  moderate: "Moderate ↓ (30–59)",
  severe: "Severe ↓ (<30)",
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
