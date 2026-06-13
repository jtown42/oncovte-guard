/**
 * Khorana VTE Risk Score engine.
 *
 * Source of truth: plan/ddi-info.md Part 1 + plan/errata-contract-reconciliation.md.
 *   - ERRATA Issue 1: maximum score is 6.
 *   - Risk tiers follow the original Khorana model / NCCN VTE-C table:
 *     score 0 = Low, 1-2 = Intermediate, >=3 = High (see riskCategoryForScore).
 *     This restores the published tiering; the earlier errata draft labeled
 *     score 1 as Low. The actionable threshold (prophylaxis at >=2) is unchanged.
 *     prophylaxisRecommended === (totalScore >= 2) AND not excluded.
 *   - ERRATA Issue 5: cancer classification uses prefix matching (classifyIcd10).
 *   - ERRATA Issue 10: exclusion is reported as a nested { isExcluded, reason } shape
 *     with snake_case reason strings.
 *
 * Khorana et al., Blood 2008:
 *   cancer site (0-2) + platelets >=350 (1) + Hgb <10 or ESA (1)
 *   + WBC >11 (1) + BMI >=35 (1).
 */

import {
  CancerCategory,
  RiskCategory,
  MAX_KHORANA_SCORE,
  type CancerConditionInput,
  type ExclusionReason,
  type KhoranaInput,
  type KhoranaConditionsInput,
  type KhoranaResult,
} from "../types/khorana";
import { classifyIcd10 } from "../data/icd10-cancer-map";

/** Threshold constants (kept explicit so boundary behavior is auditable). */
export const KHORANA_THRESHOLDS = {
  PLATELETS_GTE: 350, // x10^9/L  -> scores when value >= 350
  HEMOGLOBIN_LT: 10, // g/dL     -> scores when value < 10 (exactly 10.0 does NOT score)
  WBC_GT: 11, // x10^9/L  -> scores when value > 11 (exactly 11.0 does NOT score)
  BMI_GTE: 35, // kg/m^2   -> scores when value >= 35
} as const;

/** Cancer-site point value for a resolved (non-excluded) category. */
function cancerSitePoints(category: CancerCategory): number {
  switch (category) {
    case CancerCategory.VERY_HIGH:
      return 2;
    case CancerCategory.HIGH:
      return 1;
    default:
      return 0; // STANDARD (and EXCLUDED, which never reaches scoring)
  }
}

export interface CancerCategoryResolution {
  category: CancerCategory;
  label: string;
  exclusionReason: ExclusionReason | null;
  /** Advisory note from classification (e.g. kidney), surfaced for the banner. */
  note: string | null;
}

/**
 * Resolve the governing cancer category across all of a patient's active cancer
 * conditions.
 *
 * Precedence:
 *   1. Any EXCLUDED condition dominates — the patient follows a disease-specific
 *      VTE pathway and Khorana does not apply (NCCN VTE-2). The first exclusion
 *      encountered names the pathway.
 *   2. Otherwise the highest-scoring site governs (VERY_HIGH > HIGH > STANDARD).
 *
 * With no conditions, resolves to STANDARD (0 points) so an incomplete chart
 * still produces a defined, conservative score rather than throwing.
 */
export function getCancerCategory(
  conditions: CancerConditionInput[],
): CancerCategoryResolution {
  let best: CancerCategoryResolution = {
    category: CancerCategory.STANDARD,
    label: "Other solid tumor",
    exclusionReason: null,
    note: null,
  };
  let bestPoints = -1;

  for (const condition of conditions) {
    const c = classifyIcd10(condition.code);

    if (c.category === CancerCategory.EXCLUDED) {
      return {
        category: CancerCategory.EXCLUDED,
        label: c.label,
        exclusionReason: c.exclusionReason,
        note: c.note,
      };
    }

    const points = cancerSitePoints(c.category);
    if (points > bestPoints) {
      bestPoints = points;
      best = {
        category: c.category,
        label: c.label,
        exclusionReason: null,
        note: c.note,
      };
    }
  }

  return best;
}

/**
 * Map a final integer score to its risk tier.
 *
 * Tiering follows the original Khorana model (Khorana et al., Blood 2008) and
 * the NCCN VTE-C table: score 0 = Low, 1-2 = Intermediate, >=3 = High. The
 * actionable prophylaxis threshold (>=2) is unchanged regardless of the label
 * assigned to score 1.
 */
export function riskCategoryForScore(score: number): RiskCategory {
  if (score >= 3) return RiskCategory.HIGH;
  if (score >= 1) return RiskCategory.INTERMEDIATE; // 1 or 2
  return RiskCategory.LOW; // 0
}

/**
 * Calculate the Khorana score from a resolved KhoranaInput.
 *
 * Null lab values are treated as non-scoring (0 points) and recorded in
 * `missingFields`; `isComplete` is false whenever any required input is absent,
 * signalling the UI to flag an incomplete assessment.
 */
export function calculateKhoranaScore(input: KhoranaInput): KhoranaResult {
  const isExcluded = input.cancerCategory === CancerCategory.EXCLUDED;
  const missingFields: string[] = [];

  // --- Cancer site ---
  const cancerSiteScore = isExcluded ? 0 : cancerSitePoints(input.cancerCategory);
  const cancerSiteLabel =
    input.cancerSiteLabel ?? cancerCategoryLabel(input.cancerCategory);

  // --- Platelets >= 350 ---
  let plateletScore = 0;
  if (input.plateletCount === null) {
    missingFields.push("plateletCount");
  } else if (input.plateletCount >= KHORANA_THRESHOLDS.PLATELETS_GTE) {
    plateletScore = 1;
  }

  // --- Hemoglobin < 10 OR on ESA ---
  let hemoglobinScore = 0;
  const esaFlag = input.onESA === true;
  if (input.hemoglobin === null && !esaFlag) {
    // ESA alone can satisfy this criterion even without a hemoglobin value.
    missingFields.push("hemoglobin");
  }
  if (esaFlag || (input.hemoglobin !== null && input.hemoglobin < KHORANA_THRESHOLDS.HEMOGLOBIN_LT)) {
    hemoglobinScore = 1;
  }

  // --- WBC > 11 ---
  let wbcScore = 0;
  if (input.wbcCount === null) {
    missingFields.push("wbcCount");
  } else if (input.wbcCount > KHORANA_THRESHOLDS.WBC_GT) {
    wbcScore = 1;
  }

  // --- BMI >= 35 ---
  let bmiScore = 0;
  if (input.bmi === null) {
    missingFields.push("bmi");
  } else if (input.bmi >= KHORANA_THRESHOLDS.BMI_GTE) {
    bmiScore = 1;
  }

  const totalScore = isExcluded
    ? 0
    : cancerSiteScore + plateletScore + hemoglobinScore + wbcScore + bmiScore;

  // Defensive: the model caps at 6 (ERRATA Issue 1).
  const cappedScore = Math.min(totalScore, MAX_KHORANA_SCORE);

  const riskCategory = riskCategoryForScore(cappedScore);
  const isComplete = missingFields.length === 0;
  const prophylaxisRecommended = !isExcluded && cappedScore >= 2;

  return {
    totalScore: cappedScore,
    riskCategory,
    isComplete,
    missingFields,
    breakdown: {
      cancerSite: { value: cancerSiteLabel, score: cancerSiteScore },
      platelets: { value: input.plateletCount, score: plateletScore },
      hemoglobin: { value: input.hemoglobin, score: hemoglobinScore, esaFlag },
      wbc: { value: input.wbcCount, score: wbcScore },
      bmi: { value: input.bmi, score: bmiScore },
    },
    exclusion: {
      isExcluded,
      reason: isExcluded ? input.exclusionReason ?? null : null,
    },
    prophylaxisRecommended,
  };
}

/**
 * Convenience wrapper: resolve the cancer category from raw conditions, then
 * score. Primarily used by tests and the orchestration layer.
 */
export function calculateKhoranaScoreFromConditions(
  input: KhoranaConditionsInput,
): KhoranaResult {
  const resolved = getCancerCategory(input.conditions);
  return calculateKhoranaScore({
    cancerCategory: resolved.category,
    exclusionReason: resolved.exclusionReason,
    plateletCount: input.plateletCount,
    hemoglobin: input.hemoglobin,
    onESA: input.onESA,
    wbcCount: input.wbcCount,
    bmi: input.bmi,
    cancerSiteLabel: resolved.label,
  });
}

function cancerCategoryLabel(category: CancerCategory): string {
  switch (category) {
    case CancerCategory.VERY_HIGH:
      return "Very high risk site (2 pts)";
    case CancerCategory.HIGH:
      return "High risk site (1 pt)";
    case CancerCategory.EXCLUDED:
      return "Excluded (disease-specific pathway)";
    default:
      return "Standard risk site (0 pts)";
  }
}
