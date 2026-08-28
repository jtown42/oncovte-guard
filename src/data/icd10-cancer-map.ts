/**
 * ICD-10-CM -> Khorana cancer-category mapping.
 * Source: plan/ddi-info.md Part 1D + ERRATA Issue 5 (prefix matching via startsWith).
 *
 * Matching is hierarchical/prefix-based: a stored prefix like "C90.0" matches
 * C90.0, C90.00, C90.01, etc. Codes are normalized to uppercase with surrounding
 * whitespace removed before comparison.
 */

import { CancerCategory } from "../types/khorana";
import type { ExclusionReason } from "../types/khorana";

export interface ExclusionRule {
  prefixes: string[];
  reason: ExclusionReason;
  label: string;
}

export interface CategoryRule {
  prefixes: string[];
  label: string;
}

export interface Icd10Classification {
  category: CancerCategory;
  label: string;
  /** Set only when category === EXCLUDED. */
  exclusionReason: ExclusionReason | null;
  /** True when an advisory note should accompany the classification (e.g. kidney). */
  note: string | null;
}

/**
 * Special-exclusion populations that follow disease-specific VTE pathways
 * (NCCN VTE-2). These take precedence over site scoring (see classifyIcd10).
 */
export const EXCLUSION_RULES: ExclusionRule[] = [
  {
    // C90.0x myeloma, C90.1x plasma cell leukemia, C90.2x extramedullary
    // plasmacytoma, C90.3x solitary plasmacytoma.
    prefixes: ["C90.0", "C90.1", "C90.2", "C90.3"],
    reason: "multiple_myeloma",
    label: "Multiple myeloma / plasma cell neoplasm",
  },
  {
    // Acute leukemias (the ".0" acute forms + AML variants). Chronic leukemias
    // (C91.1 CLL, C92.1 CML) are intentionally NOT excluded.
    prefixes: ["C91.0", "C92.0", "C92.4", "C92.5", "C92.6", "C92.A", "C93.0", "C94.0", "C95.0"],
    reason: "acute_leukemia",
    label: "Acute leukemia",
  },
  {
    // Myeloproliferative neoplasms: D45 polycythemia vera, D47.1 chronic MPN,
    // D47.3 essential thrombocythemia, D47.4 primary myelofibrosis.
    prefixes: ["D45", "D47.1", "D47.3", "D47.4"],
    reason: "mpn",
    label: "Myeloproliferative neoplasm",
  },
  {
    // Primary (C71.x) and metastatic (C79.31) brain tumors.
    prefixes: ["C71", "C79.31"],
    reason: "brain_tumor",
    label: "Primary/metastatic brain tumor",
  },
];

/** Very high risk -> 2 points. */
export const VERY_HIGH_RULES: CategoryRule[] = [
  { prefixes: ["C16"], label: "Stomach (gastric) cancer" },
  { prefixes: ["C25"], label: "Pancreatic cancer" },
];

/** High risk -> 1 point. */
export const HIGH_RULES: CategoryRule[] = [
  { prefixes: ["C34"], label: "Lung cancer" },
  { prefixes: ["C81"], label: "Hodgkin lymphoma" },
  { prefixes: ["C82", "C83", "C84", "C85", "C86"], label: "Non-Hodgkin lymphoma" },
  { prefixes: ["C56"], label: "Ovarian cancer" },
  { prefixes: ["C54", "C55"], label: "Uterine cancer" },
  { prefixes: ["C53"], label: "Cervical cancer" },
  { prefixes: ["C51", "C52", "C57", "C58"], label: "Gynecologic cancer (other)" },
  { prefixes: ["C67"], label: "Bladder cancer" },
  { prefixes: ["C62"], label: "Testicular cancer" },
  // NOTE: renal-cell carcinoma (C64) is intentionally NOT in the high-risk set.
  // NCCN scores only bladder and testicular among GU cancers; scoring RCC would be
  // a grade-C divergence that could by itself cross the >=2 threshold. It is handled
  // as a non-scoring advisory in classifyIcd10 (see KIDNEY_NOTE).
];

/**
 * Renal-cell carcinoma (C64) is NOT scored by the Khorana engine (0 points),
 * matching NCCN, which names only bladder and testicular among GU high-risk sites.
 * Scoring RCC would be a grade-C divergence that could by itself cross the >=2
 * prophylaxis threshold — a contested rule should not silently change the
 * actionable output. The elevated-risk concern is instead surfaced as an advisory
 * note, and metastatic RCC additionally appears as a bleeding-risk factor (where
 * LMWH may be preferred). Renal pelvis / ureter / other urinary (C65/C66/C68) are
 * likewise not scored.
 */
const KIDNEY_NOTE =
  "Renal-cell carcinoma (kidney) carries elevated VTE risk, but NCCN scores only bladder and testicular among GU cancers, so it is NOT scored here (0 points); consider prophylaxis on individual clinical judgment. Metastatic RCC is a higher-bleeding-risk site where LMWH may be preferred. Evidence grade C.";

/**
 * Lung cancer scores as a Khorana high-risk site (1 pt), but the score's
 * discriminative performance is weak in lung cancer specifically: the van Es
 * et al. individual-patient-data meta-analysis found the score predictive in
 * other cancers (OR ~3.2) but not in lung cancer (OR ~1.1; P-interaction 0.002).
 * Surfaced so the clinician weighs the score alongside individual judgment.
 */
const LUNG_NOTE =
  "Khorana score has limited discriminative ability in lung cancer (van Es et al. IPD meta-analysis); weigh the score together with individual clinical judgment.";

/**
 * WS-6: Maria Santos — the flagship "clean recommend" — is pancreatic, and the
 * Khorana score's discrimination in pancreatic/hepatobiliary cancer is contested
 * in large validation cohorts. Surfaced as an info-level caveat (mirrors the lung
 * note); it does NOT change the score.
 */
const PANCREATIC_NOTE =
  "Khorana score discrimination is contested in pancreatic/hepatobiliary cancer in large validation cohorts; the score still meets the ≥2 threshold here, but weigh it with individual clinical judgment.";

function normalize(code: string): string {
  return code.trim().toUpperCase();
}

function matchesAny(code: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => code.startsWith(prefix.toUpperCase()));
}

/** True for any malignancy code in the ICD-10-CM cancer ranges used by the app. */
export function isCancerCode(code: string): boolean {
  const c = normalize(code);
  // C00-C97 malignant neoplasms, plus D45/D47 MPNs handled via exclusions.
  return /^C\d/.test(c) || /^D4[57]/.test(c);
}

/**
 * Classify a single ICD-10-CM code into a Khorana cancer category.
 * Exclusions are checked first and take precedence (see classifyConditions).
 */
export function classifyIcd10(rawCode: string): Icd10Classification {
  const code = normalize(rawCode);

  for (const rule of EXCLUSION_RULES) {
    if (matchesAny(code, rule.prefixes)) {
      return {
        category: CancerCategory.EXCLUDED,
        label: rule.label,
        exclusionReason: rule.reason,
        note: null,
      };
    }
  }

  for (const rule of VERY_HIGH_RULES) {
    if (matchesAny(code, rule.prefixes)) {
      return {
        category: CancerCategory.VERY_HIGH,
        label: rule.label,
        exclusionReason: null,
        note: matchesAny(code, ["C25"]) ? PANCREATIC_NOTE : null,
      };
    }
  }

  for (const rule of HIGH_RULES) {
    if (matchesAny(code, rule.prefixes)) {
      const isLung = matchesAny(code, ["C34"]);
      return {
        category: CancerCategory.HIGH,
        label: rule.label,
        exclusionReason: null,
        note: isLung ? LUNG_NOTE : null,
      };
    }
  }

  // Renal-cell carcinoma (C64): NOT scored (matches NCCN) but surfaces an advisory
  // note. A grade-C divergence should not silently change the actionable score.
  if (matchesAny(code, ["C64"])) {
    return {
      category: CancerCategory.STANDARD,
      label: "Renal-cell carcinoma (kidney)",
      exclusionReason: null,
      note: KIDNEY_NOTE,
    };
  }

  return {
    category: CancerCategory.STANDARD,
    label: "Other solid tumor",
    exclusionReason: null,
    note: null,
  };
}
