/**
 * Qualitative bleeding-risk panel (WS-2).
 *
 * The app quantifies THROMBOTIC risk (Khorana) but must not pretend to quantify
 * BLEEDING risk with a score the evidence does not support in this setting. This
 * module surfaces guideline-named bleeding-risk factors as a transparent list
 * and assigns one of three tiers — it never sums a score.
 *
 * Sources of truth for the factor list:
 *   - ACC 2026 Scientific Statement — the ready-made list of scenarios in which
 *     LMWH is preferred over a DOAC (CrCl <30, high-bleeding-risk tumor types/
 *     locations, DDIs, malabsorption, frailty/ECOG 3–4, low body weight <50 kg,
 *     anemia/thrombocytopenia/anorexia/vomiting).
 *   - NCCN VTE-2 footnote — gastric/gastroesophageal tumors are at increased
 *     hemorrhage risk with DOACs (prefer LMWH).
 *   - Vedovati et al. — systemic corticosteroids (HR 2.69).
 *   - ONCO-DOAC BLEED / ACCP — prior major bleeding; concurrent antiplatelet/NSAID.
 */

import type {
  BleedingRiskFactor,
  BleedingRiskProfile,
} from "../types/bleeding-risk";

/** Curator thresholds kept explicit for auditability. */
export const BLEEDING_RISK_THRESHOLDS = {
  SEVERE_CRCL_LT: 30, // mL/min
  LOW_WEIGHT_LT: 50, // kg
  ANEMIA_HGB_LT: 10, // g/dL (moderate anemia; curator threshold)
  THROMBOCYTOPENIA_LT: 100, // x10^9/L (below the <50 absolute; curator threshold)
} as const;

export const BLEEDING_RISK_DISCLAIMER =
  "Qualitative bleeding-risk factors — NOT a score. No validated bleeding score exists for primary prophylaxis in this population; published cancer-associated-thrombosis bleeding scores achieve c-statistics of only 0.50–0.70 and were derived in treatment, not prophylaxis, cohorts. Weigh these factors against the thrombotic (Khorana) risk clinically.";

/** ICD-10 prefixes for tumor-site bleeding factors. */
const LUMINAL_GI_PREFIXES = ["C15", "C16", "C17", "C18", "C19", "C20"]; // esophagus, gastric/GEJ, small bowel, colon, rectosigmoid, rectum
const GASTRIC_GEJ_PREFIXES = ["C16"]; // NCCN VTE-2: increased hemorrhage with DOACs → prefer LMWH
const UROTHELIAL_GYN_PREFIXES = ["C51", "C52", "C53", "C54", "C55", "C57", "C58", "C65", "C66", "C67"]; // gyn (esp. cervical C53) + urothelial
const RCC_MELANOMA_PREFIXES = ["C64", "C43"]; // renal-cell carcinoma, melanoma

export interface BleedingRiskInput {
  conditions: { code: string }[];
  /** Cockcroft-Gault CrCl in mL/min, or null when not assessable. */
  crclMlMin: number | null;
  weightKg: number | null;
  hemoglobin: number | null;
  plateletCount: number | null;
  onAntiplatelet: boolean;
  /** Clinician-set / medication-derived flags (default absent → false). */
  onNSAID?: boolean;
  onCorticosteroid?: boolean;
  hasPriorMajorBleeding?: boolean;
  /** Frailty or ECOG performance status 3–4 (excluded from CAT DOAC trials). */
  isFrailOrPoorPerformance?: boolean;
  hasAnorexiaOrVomiting?: boolean;
}

function normalize(code: string): string {
  return code.trim().toUpperCase();
}

function hasCondition(conditions: { code: string }[], prefixes: string[]): boolean {
  const ups = prefixes.map((p) => p.toUpperCase());
  return conditions.some((c) => {
    const code = normalize(c.code);
    return ups.some((p) => code.startsWith(p));
  });
}

/**
 * Build the qualitative bleeding-risk profile. `elevated` when ≥1 factor is
 * present; `insufficient_data` when no factor fires but the inputs needed to
 * clear the patient are missing; otherwise `standard`.
 */
export function assessBleedingRisk(
  input: BleedingRiskInput,
): BleedingRiskProfile {
  const factors: BleedingRiskFactor[] = [];
  const t = BLEEDING_RISK_THRESHOLDS;

  // --- Tumor-site factors ---
  if (hasCondition(input.conditions, GASTRIC_GEJ_PREFIXES)) {
    factors.push({
      key: "gastric_gej_tumor",
      label: "Gastric / gastroesophageal tumor",
      detail:
        "Increased hemorrhage risk with DOACs — LMWH preferred (NCCN VTE-2 footnote).",
      source: "NCCN VTE-2",
      prefersLmwh: true,
    });
  } else if (hasCondition(input.conditions, LUMINAL_GI_PREFIXES)) {
    // Other luminal GI (esophagus already covered by C15∈GI; colorectal, small bowel).
    factors.push({
      key: "luminal_gi_tumor",
      label: "Unresected luminal GI tumor",
      detail:
        "Luminal GI tumors (esophageal / small-bowel / colorectal) carry increased bleeding risk, especially if unresected.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (hasCondition(input.conditions, UROTHELIAL_GYN_PREFIXES)) {
    factors.push({
      key: "urothelial_or_gyn_tumor",
      label: "Urothelial or gynecologic tumor",
      detail:
        "Non-resected urothelial or gynecologic tumors (especially cervical) carry increased bleeding risk.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (hasCondition(input.conditions, RCC_MELANOMA_PREFIXES)) {
    factors.push({
      key: "rcc_or_melanoma",
      label: "Renal-cell carcinoma or melanoma",
      detail:
        "Metastatic renal-cell carcinoma and melanoma are associated with increased bleeding risk.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  // --- Physiologic / lab factors ---
  if (input.crclMlMin !== null && input.crclMlMin < t.SEVERE_CRCL_LT) {
    factors.push({
      key: "severe_renal_impairment",
      label: "CrCl <30 mL/min",
      detail: "Severe renal impairment raises bleeding risk — LMWH preferred.",
      source: "ACC 2026 Scientific Statement; NCCN VTE-B-2",
      prefersLmwh: true,
    });
  }

  if (input.weightKg !== null && input.weightKg < t.LOW_WEIGHT_LT) {
    factors.push({
      key: "low_body_weight",
      label: "Low body weight (<50 kg)",
      detail: "Low body weight (<50 kg) is associated with increased bleeding risk.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (input.hemoglobin !== null && input.hemoglobin < t.ANEMIA_HGB_LT) {
    factors.push({
      key: "anemia",
      label: "Anemia (Hgb <10 g/dL)",
      detail: "Anemia is a recognized bleeding-risk marker in this population.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (
    input.plateletCount !== null &&
    input.plateletCount < t.THROMBOCYTOPENIA_LT
  ) {
    factors.push({
      key: "thrombocytopenia",
      label: "Thrombocytopenia (<100 ×10⁹/L)",
      detail:
        "Thrombocytopenia below 100 ×10⁹/L raises bleeding risk (below 50 is an absolute contraindication).",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (input.hasAnorexiaOrVomiting) {
    factors.push({
      key: "anorexia_or_vomiting",
      label: "Anorexia / vomiting",
      detail:
        "Anorexia or vomiting (impaired intake/absorption) raises bleeding risk and can affect DOAC exposure.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: false,
    });
  }

  if (input.isFrailOrPoorPerformance) {
    factors.push({
      key: "frailty_or_ecog_3_4",
      label: "Frailty / ECOG 3–4",
      detail:
        "Frail or poor-performance-status patients were excluded from the CAT DOAC trials; treat as elevated bleeding risk.",
      source: "ACC 2026 Scientific Statement",
      prefersLmwh: true,
    });
  }

  // --- Medication / history factors ---
  if (input.onCorticosteroid) {
    factors.push({
      key: "systemic_corticosteroid",
      label: "Systemic corticosteroids",
      detail: "Systemic corticosteroids increase bleeding risk (Vedovati et al., HR 2.69).",
      source: "Vedovati et al.",
      prefersLmwh: false,
    });
  }

  if (input.onAntiplatelet || input.onNSAID) {
    factors.push({
      key: "antiplatelet_or_nsaid",
      label: "Concurrent antiplatelet / NSAID",
      detail:
        "Concurrent antiplatelet or NSAID therapy adds to anticoagulant bleeding risk.",
      source: "ACC 2026 Scientific Statement; ONCO-DOAC BLEED",
      prefersLmwh: false,
    });
  }

  if (input.hasPriorMajorBleeding) {
    factors.push({
      key: "prior_major_bleeding",
      label: "Prior major bleeding",
      detail: "A history of major bleeding is a strong bleeding-risk factor.",
      source: "ONCO-DOAC BLEED; ACCP",
      prefersLmwh: false,
    });
  }

  const prefersLmwh = factors.some((f) => f.prefersLmwh);

  // Determine tier.
  if (factors.length > 0) {
    return {
      tier: "elevated",
      factors,
      prefersLmwh,
      missingInputs: [],
      disclaimer: BLEEDING_RISK_DISCLAIMER,
    };
  }

  // No factor fired — is that because the patient is genuinely low-risk, or
  // because we could not evaluate the derived factors? Track the core inputs.
  const missingInputs: string[] = [];
  if (input.crclMlMin === null) missingInputs.push("crcl");
  if (input.weightKg === null) missingInputs.push("weightKg");
  if (input.hemoglobin === null) missingInputs.push("hemoglobin");
  if (input.plateletCount === null) missingInputs.push("plateletCount");

  if (missingInputs.length > 0) {
    return {
      tier: "insufficient_data",
      factors: [],
      prefersLmwh: false,
      missingInputs,
      disclaimer: BLEEDING_RISK_DISCLAIMER,
    };
  }

  return {
    tier: "standard",
    factors: [],
    prefersLmwh: false,
    missingInputs: [],
    disclaimer: BLEEDING_RISK_DISCLAIMER,
  };
}
