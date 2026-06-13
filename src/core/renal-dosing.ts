/**
 * Renal dosing module: Cockcroft-Gault CrCl + per-anticoagulant recommendations.
 *
 * Source of truth: plan/ddi-info.md Part 2 + plan/errata-contract-reconciliation.md.
 *   - ERRATA Issue 8: doacRecommendations is an array of 6 entries (4 DOACs +
 *     2 LMWH) with a getRenalRecommendation() lookup helper.
 *
 * Cockcroft-Gault (mL/min):
 *   CrCl = [(140 - age) * weight(kg) * (0.85 if female)] / [72 * SCr(mg/dL)]
 */

import type {
  AnticoagulantName,
  CrclCategory,
  DOACRenalRecommendation,
  RenalInput,
  RenalResult,
} from "../types/renal";
import {
  ASSESSED_ANTICOAGULANTS,
  getAnticoagulantRenalRecommendation,
} from "../data/doac-renal-thresholds";
import { NEPHROTOXIC_CHEMO_RXNORM } from "../data/rxnorm-codes";

/**
 * Cockcroft-Gault creatinine clearance.
 * Returns mL/min, rounded to one decimal place. Guards against a zero/negative
 * serum creatinine (which would divide by zero) by returning 0.
 */
export function calculateCrCl(input: RenalInput): number {
  const { age, weightKg, gender, serumCreatinine } = input;
  if (serumCreatinine <= 0 || weightKg <= 0 || age < 0) {
    return 0;
  }
  const sexFactor = gender === "female" ? 0.85 : 1;
  const crcl = ((140 - age) * weightKg * sexFactor) / (72 * serumCreatinine);
  const bounded = Math.max(crcl, 0);
  return Math.round(bounded * 10) / 10;
}

/** Band the CrCl for color coding (ERRATA: severe = <30). */
export function categorizeCrCl(crcl: number): CrclCategory {
  if (crcl >= 90) return "normal";
  if (crcl >= 60) return "mild";
  if (crcl >= 30) return "moderate";
  return "severe";
}

/**
 * Build the full renal assessment: CrCl, its category, a recommendation for
 * each of the six anticoagulants, and any contextual warnings.
 *
 * Warnings:
 *   - "sarcopenia": low body weight (<60 kg) can make Cockcroft-Gault
 *     overestimate true clearance in cachectic cancer patients.
 *   - "nephrotoxic_chemotherapy": an active nephrotoxic agent (e.g. cisplatin)
 *     may cause CrCl to fall; recheck before/under therapy.
 */
export function assessRenalFunction(input: RenalInput): RenalResult {
  const crclMlMin = calculateCrCl(input);
  const crclCategory = categorizeCrCl(crclMlMin);

  const doacRecommendations: DOACRenalRecommendation[] = ASSESSED_ANTICOAGULANTS.map(
    (agent) => getAnticoagulantRenalRecommendation(agent, crclMlMin),
  );

  const warnings: string[] = [];
  if (input.weightKg > 0 && input.weightKg < 60) {
    warnings.push("sarcopenia");
  }
  const meds = input.medications ?? [];
  if (meds.some((m) => NEPHROTOXIC_CHEMO_RXNORM.has(m.rxnormCode))) {
    warnings.push("nephrotoxic_chemotherapy");
  }

  return { crclMlMin, crclCategory, doacRecommendations, warnings };
}

/**
 * Look up the renal recommendation for a single anticoagulant by name
 * (ERRATA Issue 8). Returns undefined if the agent was not assessed.
 */
export function getRenalRecommendation(
  result: RenalResult,
  doacName: AnticoagulantName | string,
): DOACRenalRecommendation | undefined {
  return result.doacRecommendations.find((r) => r.doac === doacName);
}
