/**
 * Khorana VTE Risk Score types.
 *
 * Source of truth: plan/ddi-info.md Part 1 + plan/errata-contract-reconciliation.md.
 * Per ERRATA Issue 1, the maximum Khorana score is 6 (not 7).
 * Risk tiers follow the original Khorana model / NCCN VTE-C: score 0 = Low,
 * 1-2 = Intermediate, >=3 = High (this restores the published tiering; see the
 * dated supersession note in errata-contract-reconciliation.md, Issue 2).
 * Prophylaxis is recommended when totalScore >= 2.
 */

/** Maximum achievable Khorana score (cancer site 0-2 + four 1-point criteria). */
export const MAX_KHORANA_SCORE = 6;

/** Khorana cancer-site risk category, derived from the ICD-10 diagnosis. */
export enum CancerCategory {
  VERY_HIGH = "very_high", // stomach, pancreas -> 2 pts
  HIGH = "high", // lung, lymphoma, gyn, bladder, testicular -> 1 pt
  STANDARD = "standard", // all other solid tumors -> 0 pts
  EXCLUDED = "excluded", // myeloma, brain, acute leukemia, MPN -> Khorana N/A
}

/** Overall VTE risk tier (Khorana model / NCCN VTE-C). */
export enum RiskCategory {
  LOW = "low", // score 0
  INTERMEDIATE = "intermediate", // score 1-2
  HIGH = "high", // score >=3
}

/** Canonical, snake_case exclusion reasons (ERRATA Issue 10). */
export type ExclusionReason =
  | "multiple_myeloma"
  | "brain_tumor"
  | "acute_leukemia"
  | "mpn";

/** A single active cancer Condition, reduced to what the engine needs. */
export interface CancerConditionInput {
  code: string; // ICD-10-CM, e.g. "C25.1"
  display?: string;
}

export interface KhoranaInput {
  cancerCategory: CancerCategory;
  /** Populated when cancerCategory === EXCLUDED, so the result can name the pathway. */
  exclusionReason?: ExclusionReason | null;
  plateletCount: number | null; // x10^9/L
  hemoglobin: number | null; // g/dL
  onESA: boolean; // erythropoiesis-stimulating agent in active meds
  wbcCount: number | null; // x10^9/L
  bmi: number | null; // kg/m^2
  /** Optional display label for the scoring cancer site (banner / breakdown). */
  cancerSiteLabel?: string;
}

/** Conditions-based convenience input: resolves the cancer category internally. */
export interface KhoranaConditionsInput {
  conditions: CancerConditionInput[];
  plateletCount: number | null;
  hemoglobin: number | null;
  onESA: boolean;
  wbcCount: number | null;
  bmi: number | null;
}

export interface KhoranaCriterionBreakdown {
  value: number | null;
  score: number;
}

export interface HemoglobinBreakdown extends KhoranaCriterionBreakdown {
  esaFlag: boolean;
}

export interface CancerSiteBreakdown {
  value: string; // human-readable category/site
  score: number;
}

export interface KhoranaExclusion {
  isExcluded: boolean;
  reason: ExclusionReason | null;
}

export interface KhoranaResult {
  totalScore: number;
  riskCategory: RiskCategory;
  isComplete: boolean;
  missingFields: string[];
  breakdown: {
    cancerSite: CancerSiteBreakdown;
    platelets: KhoranaCriterionBreakdown;
    hemoglobin: HemoglobinBreakdown;
    wbc: KhoranaCriterionBreakdown;
    bmi: KhoranaCriterionBreakdown;
  };
  exclusion: KhoranaExclusion;
  /** true when totalScore >= 2 AND not excluded (ERRATA Issue 2). */
  prophylaxisRecommended: boolean;
}
