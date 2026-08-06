/**
 * Synthesized prophylaxis recommendation types.
 * Source: plan/ddi-info.md Part 11 + ERRATA Issue 4
 * (DOACOption.hasNccnProphylaxisIndication; dabigatran/edoxaban are never
 * presented as prophylaxis options).
 */

import type { KhoranaResult } from "./khorana";
import type { RenalResult, RenalRecommendationStatus } from "./renal";
import type { DDICheckResult, DDISeverity } from "./ddi";
import type { ContraindicationResult } from "./contraindication";
import type { BleedingRiskProfile } from "./bleeding-risk";

export type OverallAction =
  | "recommend"
  | "caution"
  | "contraindicated"
  | "not_indicated"
  | "excluded";

/**
 * F4 (WS-5): a display-oriented refinement of `overallAction`. Adds
 * `recommend_lmwh` for the case where both DOACs are blocked and LMWH is the
 * recommendation, so the UI can say "Prophylaxis recommended — LMWH (DOACs
 * blocked)" without changing the machine-stable `overallAction` API consumers rely on.
 */
export type VerdictLabel = OverallAction | "recommend_lmwh";

export interface DOACOption {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  renalStatus: RenalRecommendationStatus;
  worstDDI: DDISeverity;
  /** true if no MAJOR DDI, renal status not "avoid", and not blocked by a targeted contraindication. */
  eligible: boolean;
  ineligibleReason: string | null;
  /** ERRATA Issue 4: true only for apixaban and rivaroxaban. */
  hasNccnProphylaxisIndication: boolean;
}

export interface Alert {
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  source: string; // e.g. "NCCN VTE-B", "AHA 2022"
}

export interface ProphylaxisRecommendation {
  khorana: KhoranaResult;
  renal: RenalResult | null;
  ddiResults: DDICheckResult[];
  contraindications: ContraindicationResult;
  /** WS-2: qualitative bleeding-risk panel (present on every pathway). */
  bleedingRisk: BleedingRiskProfile;
  staleLabWarning: boolean;
  staleLabFields: string[];

  // Final synthesized output
  overallAction: OverallAction;
  /** F4 (WS-5): display refinement of overallAction (adds `recommend_lmwh`). */
  verdictLabel: VerdictLabel;
  preferredOptions: DOACOption[];
  alternativeOptions: DOACOption[];
  avoidOptions: DOACOption[];
  alerts: Alert[];
  disclaimers: string[];
}
