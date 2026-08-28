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
import type { AnticoagulantName } from "../types/renal";

/** Default upper limits of normal (used when the lab does not carry its own). */
const ALT_ULN_DEFAULT = 40; // U/L
const AST_ULN_DEFAULT = 40; // U/L
const BILI_ULN_DEFAULT = 1.2; // mg/dL (total bilirubin)

/** Thresholds (kept explicit for auditability). */
export const CONTRAINDICATION_THRESHOLDS = {
  SEVERE_THROMBOCYTOPENIA_LT: 50, // x10^9/L  (i.e. <50,000/uL)
  APIXABAN_LOW_WEIGHT_LT: 40, // kg — absolute, apixaban (NCCN VTE-B-2)
  // (The general DOAC caution at weight <50 kg per NCCN VTE-D is already surfaced
  // by the bleeding-risk panel's low-body-weight factor — not duplicated here.)
  // Per-agent hepatic contraindications, NCCN VTE-D-5 (v1.2026). Expressed as
  // multiples of each lab's own ULN (not absolute values), so they track the
  // lab's reference range. Each DOAC has its own logic — see the hepaticRules
  // table in detectContraindications for the disjunctive/conjunctive wiring.
  // (WS-1.4 re-anchor: replaces the prior single conjunctive bilirubin>3 mg/dL
  // AND transaminases>5x ULN universal surrogate, which under-excluded — e.g.
  // AST 4x ULN with normal bilirubin passed it, yet NCCN avoids apixaban there.)
  HEPATIC_APIXABAN_TRANSAMINASE_ULN_MULT: 3,
  HEPATIC_APIXABAN_BILIRUBIN_ULN_MULT: 2,
  HEPATIC_RIVAROXABAN_TRANSAMINASE_ULN_MULT: 3,
  HEPATIC_DABIGATRAN_TRANSAMINASE_ULN_MULT: 2,
  HEPATIC_EDOXABAN_TRANSAMINASE_ULN_MULT: 3,
  HEPATIC_EDOXABAN_BILIRUBIN_ULN_MULT: 2,
} as const;

/** ICD-10 prefixes used by contraindication detection. */
const HIT_PREFIXES = ["D75.82"];
const APS_PREFIXES = ["D68.61"];
const GI_TRACT_PREFIXES = ["C15", "C16", "C67"]; // esophagus/GEJ, gastric, bladder
const BRAIN_TUMOR_PREFIXES = ["C71", "C79.31"];
const MYELOMA_PREFIXES = ["C90.0", "C90.1", "C90.2", "C90.3"];
// Pregnancy (O00-O9A, Z33.1 incidental pregnant state, Z3A weeks of gestation)
// and breastfeeding (Z39.1). DOACs cross the placenta and are excreted in milk;
// LMWH is the standard anticoagulant in pregnancy.
const PREGNANCY_PREFIXES = ["O", "Z33.1", "Z3A", "Z39.1"];

/** The four DOACs (prophylaxis + reference), targeted by class-level DOAC blocks. */
const ALL_DOACS: AnticoagulantName[] = [
  "apixaban",
  "rivaroxaban",
  "dabigatran",
  "edoxaban",
];

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
  /** Hepatic panel for the per-agent NCCN VTE-D-5 hepatic contraindications. */
  totalBilirubin?: number | null;
  alt?: number | null;
  ast?: number | null;
  altUln?: number;
  astUln?: number;
  biliUln?: number;
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

  // Antiphospholipid syndrome, D68.61 — targeted to the DOAC class, NOT universal.
  // DOACs cause excess arterial thrombosis vs VKA (TRAPS stopped early; pooled OR
  // ~5.4, driven by stroke), with no difference in VTE or major bleeding. NCCN
  // VTE-D-5 contraindicates the DOAC class in APS, warfarin preferred — it does
  // NOT contraindicate all anticoagulation, so LMWH remains available and the
  // engine falls back to it. Flagged for any diagnosed thrombotic APS (the trial
  // evidence found no effect modification by triple- vs single/double-positivity).
  if (hasConditionMatching(input.conditions, APS_PREFIXES)) {
    absolute.push({
      type: "absolute",
      reason: "antiphospholipid_syndrome",
      detail:
        "Antiphospholipid syndrome: avoid DOACs (excess arterial thrombosis vs VKA — TRAPS; pooled OR ~5.4). Warfarin is preferred for therapeutic APS; for prophylaxis here, LMWH is the acceptable alternative.",
      appliesTo: ALL_DOACS,
      source: "NCCN VTE-D-5; TRAPS (Pengo 2018)",
    });
  }

  // Pregnancy or breastfeeding — targeted absolute to the DOAC class (NCCN VTE-D-5).
  // DOACs cross the placenta and are excreted in breast milk; LMWH is the standard
  // anticoagulant in pregnancy, so LMWH remains and the engine falls back to it.
  // Detected from coded conditions (O*/Z33.1/Z3A/Z39.1) — no clinician boolean needed.
  if (hasConditionMatching(input.conditions, PREGNANCY_PREFIXES)) {
    absolute.push({
      type: "absolute",
      reason: "pregnancy_or_breastfeeding",
      detail:
        "Pregnancy or breastfeeding: DOACs are contraindicated (placental transfer / milk excretion). Use LMWH, the standard anticoagulant in pregnancy.",
      appliesTo: ALL_DOACS,
      source: "NCCN VTE-D-5",
    });
  }

  // Severe hepatic impairment — PER-AGENT, NCCN VTE-D-5 (v1.2026). Each DOAC
  // carries its own hepatic contraindication; most are disjunctive (any one
  // criterion avoids the agent), while edoxaban's transaminase+bilirubin arm is
  // conjunctive. Modeled targeted (appliesTo per agent) exactly like HIT:
  // hepatic impairment blocks the affected DOAC(s), not anticoagulation
  // universally — LMWH remains, and the engine falls back to it. Thresholds are
  // multiples of each lab's own ULN. Only the LAB-BASED arm is automated; NCCN
  // also lists Child-Pugh class (and, for dabigatran/edoxaban, cirrhosis /
  // active hepatitis), which require clinical assessment the app does not read
  // (albumin, INR, ascites, encephalopathy) — surfaced as a caveat in each
  // detail below so the automated vs. clinician-assessed arms stay explicit.
  const altUln = input.altUln ?? ALT_ULN_DEFAULT;
  const astUln = input.astUln ?? AST_ULN_DEFAULT;
  const biliUln = input.biliUln ?? BILI_ULN_DEFAULT;
  const altR = input.alt != null ? input.alt / altUln : null;
  const astR = input.ast != null ? input.ast / astUln : null;
  const biliR =
    input.totalBilirubin != null ? input.totalBilirubin / biliUln : null;
  const gt = (ratio: number | null, mult: number): boolean =>
    ratio != null && ratio > mult;
  const T = CONTRAINDICATION_THRESHOLDS;
  const CHILD_PUGH_CAVEAT =
    " Child-Pugh B/C is a separate NCCN contraindication requiring clinical assessment (not lab-derived here).";

  const hepaticRules: {
    agent: AnticoagulantName;
    trips: boolean;
    detail: string;
  }[] = [
    {
      agent: "apixaban",
      trips:
        gt(altR, T.HEPATIC_APIXABAN_TRANSAMINASE_ULN_MULT) ||
        gt(astR, T.HEPATIC_APIXABAN_TRANSAMINASE_ULN_MULT) ||
        gt(biliR, T.HEPATIC_APIXABAN_BILIRUBIN_ULN_MULT),
      detail:
        "Apixaban: avoid if ALT/AST >3x ULN or total bilirubin >2x ULN (NCCN VTE-D-5)." +
        CHILD_PUGH_CAVEAT,
    },
    {
      agent: "rivaroxaban",
      trips:
        gt(altR, T.HEPATIC_RIVAROXABAN_TRANSAMINASE_ULN_MULT) ||
        gt(astR, T.HEPATIC_RIVAROXABAN_TRANSAMINASE_ULN_MULT),
      detail:
        "Rivaroxaban: avoid if ALT/AST >3x ULN (NCCN VTE-D-5)." +
        CHILD_PUGH_CAVEAT,
    },
    {
      agent: "dabigatran",
      trips:
        gt(altR, T.HEPATIC_DABIGATRAN_TRANSAMINASE_ULN_MULT) ||
        gt(astR, T.HEPATIC_DABIGATRAN_TRANSAMINASE_ULN_MULT),
      detail:
        "Dabigatran: avoid if ALT/AST >2x ULN (also cirrhosis or active/acute hepatitis) (NCCN VTE-D-5)." +
        CHILD_PUGH_CAVEAT,
    },
    {
      agent: "edoxaban",
      trips:
        (gt(altR, T.HEPATIC_EDOXABAN_TRANSAMINASE_ULN_MULT) ||
          gt(astR, T.HEPATIC_EDOXABAN_TRANSAMINASE_ULN_MULT)) &&
        gt(biliR, T.HEPATIC_EDOXABAN_BILIRUBIN_ULN_MULT),
      detail:
        "Edoxaban: avoid if ALT/AST >3x ULN AND total bilirubin >2x ULN (also cirrhosis or active hepatitis) (NCCN VTE-D-5)." +
        CHILD_PUGH_CAVEAT,
    },
  ];
  for (const rule of hepaticRules) {
    if (rule.trips) {
      absolute.push({
        type: "absolute",
        reason: "severe_hepatic_impairment",
        detail: rule.detail,
        appliesTo: [rule.agent],
        source: "NCCN VTE-D-5 (v1.2026)",
      });
    }
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

  // (Weight <40 kg is now a targeted ABSOLUTE for apixaban — see above, WS-1.1.
  // The general DOAC caution at weight <50 kg per NCCN VTE-D is surfaced by the
  // bleeding-risk panel's low-body-weight factor rather than duplicated here.)

  // canProceedWithProphylaxis is false only when a UNIVERSAL absolute
  // contraindication exists (ERRATA Issue 9).
  const hasUniversalAbsolute = absolute.some((c) => c.appliesTo === "all");

  return {
    absolute,
    relative,
    canProceedWithProphylaxis: !hasUniversalAbsolute,
  };
}
