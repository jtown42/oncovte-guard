/**
 * Renal dosing types (Cockcroft-Gault CrCl + per-anticoagulant recommendations).
 * Source: plan/ddi-info.md Part 2 + ERRATA Issue 8 (array + lookup helper, 6 entries).
 */

export type RenalRecommendationStatus = "standard" | "caution" | "avoid";

/** CrCl band used for color coding (ERRATA: severe = <30). */
export type CrclCategory = "normal" | "mild" | "moderate" | "severe";

/** Anticoagulants assessed by the renal module (4 DOACs + 2 LMWH). */
export type AnticoagulantName =
  | "apixaban"
  | "rivaroxaban"
  | "dabigatran"
  | "edoxaban"
  | "enoxaparin"
  | "dalteparin";

export interface RenalInput {
  age: number;
  weightKg: number;
  gender: "male" | "female";
  serumCreatinine: number; // mg/dL
  bmi?: number | null;
  /** Active medications (RxNorm) used to raise the nephrotoxic-chemo warning. */
  medications?: { rxnormCode: string }[];
}

export interface DOACRenalRecommendation {
  doac: AnticoagulantName;
  recommendation: RenalRecommendationStatus;
  dose: string;
  rationale: string;
}

export interface RenalResult {
  crclMlMin: number;
  crclCategory: CrclCategory;
  /** Always 6 entries: apixaban, rivaroxaban, dabigatran, edoxaban, enoxaparin, dalteparin. */
  doacRecommendations: DOACRenalRecommendation[];
  warnings: string[]; // e.g. "sarcopenia", "nephrotoxic_chemotherapy"
}
