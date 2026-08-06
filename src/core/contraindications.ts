/**
 * Contraindication / caution detection.
 *
 * Source of truth: plan/ddi-info.md Part 4 + plan/errata-contract-reconciliation.md.
 *   - ERRATA Issue 9: contraindications carry an `appliesTo` scope ("all" or a
 *     list of specific anticoagulants). HIT, for example, blocks only LMWH
 *     (["enoxaparin","dalteparin"]) — DOACs remain available and are in fact
 *     preferred. The orchestration filters on `appliesTo` before declaring a
 *     global "contraindicated" state.
 *   - ERRATA Issue 10: reason strings are snake_case; results use the nested
 *     ContraindicationResult shape.
 */

import type {
  Contraindication,
  ContraindicationResult,
} from "../types/contraindication";

/** Default upper limits of normal for aminotransferases (U/L). */
const ALT_ULN_DEFAULT = 40;
const AST_ULN_DEFAULT = 40;

/** Thresholds (kept explicit for auditability). */
export const CONTRAINDICATION_THRESHOLDS = {
  SEVERE_THROMBOCYTOPENIA_LT: 50, // x10^9/L  (i.e. <50,000/uL)
  HEPATIC_BILIRUBIN_GT: 3, // mg/dL
  HEPATIC_AMINOTRANSFERASE_ULN_MULT: 5, // >5x ULN
  APIXABAN_LOW_WEIGHT_LT: 40, // kg
} as const;

/** ICD-10 prefixes used by contraindication detection. */
const HIT_PREFIXES = ["D75.82"];
const APS_PREFIXES = ["D68.61"];
const GI_TRACT_PREFIXES = ["C15", "C16", "C67"]; // esophagus/GEJ, gastric, bladder
const BRAIN_TUMOR_PREFIXES = ["C71", "C79.31"];
const MYELOMA_PREFIXES = ["C90.0", "C90.1", "C90.2", "C90.3"];

/** Inputs for contraindication detection (a projection of PatientData). */
export interface ContraindicationInput {
  conditions: { code: string }[];
  /** Platelet count in x10^9/L (= K/uL). Null when unavailable. */
  plateletCount: number | null;
  weightKg: number | null;
  onAntiplatelet: boolean;
  onIMiD: boolean;
  /** Clinically-determined active major bleeding (no single code). */
  hasActiveMajorBleeding?: boolean;
  /** Hepatic panel for the lab-only severe-hepatic-impairment proxy (WS-1.4). */
  totalBilirubin?: number | null;
  alt?: number | null;
  ast?: number | null;
  altUln?: number;
  astUln?: number;
}

function normalize(code: string): string {
  return code.trim().toUpperCase();
}

function hasConditionMatching(
  conditions: { code: string }[],
  prefixes: string[],
): boolean {
  const ups = prefixes.map((p) => p.toUpperCase());
  return conditions.some((c) => {
    const code = normalize(c.code);
    return ups.some((p) => code.startsWith(p));
  });
}

/**
 * Detect absolute and relative contraindications. Each carries an `appliesTo`
 * scope so the orchestration can block specific agents without aborting the
 * whole assessment (ERRATA Issue 9).
 */
export function detectContraindications(
  input: ContraindicationInput,
): ContraindicationResult {
  const absolute: Contraindication[] = [];
  const relative: Contraindication[] = [];

  // --- ABSOLUTE ---

  // Active major bleeding (clinical flag) — universal.
  if (input.hasActiveMajorBleeding) {
    absolute.push({
      type: "absolute",
      reason: "active_major_bleeding",
      detail: "Active major bleeding — anticoagulation contraindicated.",
      appliesTo: "all",
    });
  }

  // Severe thrombocytopenia (<50,000/uL) — universal.
  // NCCN VTE-B-2 lists "Avoid if platelet count <50,000/uL" as a per-agent
  // consideration on all four prophylaxis agents (apixaban, rivaroxaban,
  // dalteparin, enoxaparin); NCCN VTE-F separately states DOACs are not
  // recommended below 50,000/uL given limited published experience (WS-1.2).
  if (
    input.plateletCount !== null &&
    input.plateletCount < CONTRAINDICATION_THRESHOLDS.SEVERE_THROMBOCYTOPENIA_LT
  ) {
    absolute.push({
      type: "absolute",
      reason: "severe_thrombocytopenia",
      detail:
        "Platelet count <50,000/uL — avoid all anticoagulation until platelet recovery. NCCN does not recommend DOAC use below a platelet count of 50,000/uL given limited published experience.",
      appliesTo: "all",
      source: "NCCN VTE-B-2 (per-agent); VTE-F",
    });
  }

  // Antiphospholipid syndrome (triple-positive), D68.61 — universal absolute
  // (DOACs failed in TRAPS; this pathway requires individualized management).
  if (hasConditionMatching(input.conditions, APS_PREFIXES)) {
    absolute.push({
      type: "absolute",
      reason: "antiphospholipid_syndrome",
      detail:
        "Antiphospholipid syndrome (triple-positive): DOACs are contraindicated. Manage per specialist guidance.",
      appliesTo: "all",
    });
  }

  // Severe hepatic impairment — universal. WS-1.4: this is a conservative
  // lab-only proxy for severe hepatic impairment (bilirubin >3 mg/dL and AST or
  // ALT >5x ULN), NOT Child-Pugh: true Child-Pugh also needs albumin, INR,
  // ascites, and encephalopathy, none of which the app reads. The domain is
  // guideline-recognized — NCCN's regimen-selection language names "elevated
  // transaminases or bilirubin, Child-Pugh B and C liver impairment, or
  // cirrhosis" — but this operationalization is ours.
  const altUln = input.altUln ?? ALT_ULN_DEFAULT;
  const astUln = input.astUln ?? AST_ULN_DEFAULT;
  const mult = CONTRAINDICATION_THRESHOLDS.HEPATIC_AMINOTRANSFERASE_ULN_MULT;
  const highBili =
    input.totalBilirubin != null &&
    input.totalBilirubin > CONTRAINDICATION_THRESHOLDS.HEPATIC_BILIRUBIN_GT;
  const highAminotransferase =
    (input.alt != null && input.alt > mult * altUln) ||
    (input.ast != null && input.ast > mult * astUln);
  if (highBili && highAminotransferase) {
    absolute.push({
      type: "absolute",
      reason: "severe_hepatic_impairment",
      detail:
        "Total bilirubin >3 mg/dL with transaminases >5x ULN (conservative lab-only proxy for severe hepatic impairment; not Child-Pugh) — avoid DOACs.",
      appliesTo: "all",
      source: "NCCN VTE-B (hepatic regimen selection); operationalization by OncoVTE Guard",
    });
  }

  // HIT (D75.82) — targeted: blocks LMWH only; DOACs remain (and are preferred).
  if (hasConditionMatching(input.conditions, HIT_PREFIXES)) {
    absolute.push({
      type: "absolute",
      reason: "hit",
      detail:
        "Heparin-induced thrombocytopenia: avoid heparin/LMWH. DOACs are an acceptable alternative.",
      appliesTo: ["enoxaparin", "dalteparin"],
    });
  }

  // Weight <40 kg — targeted ABSOLUTE for apixaban (WS-1.1). NCCN VTE-B-2 states
  // verbatim "Avoid if weight <40 kg" for apixaban: a categorical guideline
  // instruction, not a curator inference. Targeted (not universal), so a <40 kg
  // patient still receives rivaroxaban or LMWH rather than a global contraindication.
  if (
    input.weightKg !== null &&
    input.weightKg < CONTRAINDICATION_THRESHOLDS.APIXABAN_LOW_WEIGHT_LT
  ) {
    absolute.push({
      type: "absolute",
      reason: "weight_below_40kg",
      detail:
        "Weight <40 kg: avoid apixaban per NCCN (VTE-B-2). Use rivaroxaban or LMWH with weight-based dosing.",
      appliesTo: ["apixaban"],
      source: "NCCN VTE-B-2",
    });
  }

  // --- RELATIVE ---

  // Luminal GI / GU tract cancer — universal caution.
  if (hasConditionMatching(input.conditions, GI_TRACT_PREFIXES)) {
    relative.push({
      type: "relative",
      reason: "gi_tract_cancer",
      detail:
        "GI/GU tract tumor: increased hemorrhage risk with DOACs. Apixaban may be safer than rivaroxaban/edoxaban (NCCN 2B); consider LMWH.",
      appliesTo: "all",
    });
  }

  // Brain tumor — universal caution (also a Khorana exclusion).
  if (hasConditionMatching(input.conditions, BRAIN_TUMOR_PREFIXES)) {
    relative.push({
      type: "relative",
      reason: "brain_tumor",
      detail:
        "Primary/metastatic brain tumor: excluded from Khorana-based recommendation. Individualized risk-benefit assessment required.",
      appliesTo: "all",
    });
  }

  // Multiple myeloma on IMiD — universal caution (separate pathway).
  if (
    hasConditionMatching(input.conditions, MYELOMA_PREFIXES) &&
    input.onIMiD
  ) {
    relative.push({
      type: "relative",
      reason: "multiple_myeloma_imid",
      detail:
        "Multiple myeloma on IMiD therapy follows a separate VTE prophylaxis pathway (NCCN Multiple Myeloma guidelines).",
      appliesTo: "all",
    });
  }

  // Concurrent antiplatelet — universal caution.
  if (input.onAntiplatelet) {
    relative.push({
      type: "relative",
      reason: "concurrent_antiplatelet",
      detail:
        "Concurrent antiplatelet + anticoagulant increases bleeding risk. Reassess the indication for dual therapy.",
      appliesTo: "all",
    });
  }

  // (Weight <40 kg is now a targeted ABSOLUTE for apixaban — see above, WS-1.1.)

  // canProceedWithProphylaxis is false only when a UNIVERSAL absolute
  // contraindication exists (ERRATA Issue 9).
  const hasUniversalAbsolute = absolute.some((c) => c.appliesTo === "all");

  return {
    absolute,
    relative,
    canProceedWithProphylaxis: !hasUniversalAbsolute,
  };
}
