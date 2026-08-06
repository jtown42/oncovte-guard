/**
 * Qualitative bleeding-risk types (WS-2).
 *
 * Deliberately NOT a summed score. No validated bleeding score exists for
 * PRIMARY PROPHYLAXIS in the ambulatory Khorana population: published
 * cancer-associated-thrombosis (CAT) bleeding scores reach c-statistics of only
 * ~0.50–0.70 and were derived in patients being TREATED for established CAT, not
 * in patients receiving primary prophylaxis — applying them here is off-label
 * extrapolation. Instead this is a transparent panel of guideline-named factors
 * (ACC 2026 Scientific Statement; NCCN VTE-2), each individually sourced.
 */

export type BleedingRiskTier = "elevated" | "standard" | "insufficient_data";

export interface BleedingRiskFactor {
  /** snake_case stable key. */
  key: string;
  /** Short human label for the panel. */
  label: string;
  /** One-line rationale. */
  detail: string;
  /** Guideline citation for this specific factor. */
  source: string;
  /** True when this factor specifically favors LMWH over a DOAC. */
  prefersLmwh: boolean;
}

export interface BleedingRiskProfile {
  tier: BleedingRiskTier;
  /** Factors detected as present (empty when standard). */
  factors: BleedingRiskFactor[];
  /** True if any present factor favors LMWH over a DOAC. */
  prefersLmwh: boolean;
  /** Inputs that were missing, driving `insufficient_data`. */
  missingInputs: string[];
  /** The mandatory honest framing shown with the panel. */
  disclaimer: string;
}
