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

export type OverallAction =
  | "recommend"
  | "caution"
  | "contraindicated"
  | "not_indicated"
  | "excluded";

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
  staleLabWarning: boolean;
  staleLabFields: string[];

  // Final synthesized output
  overallAction: OverallAction;
  preferredOptions: DOACOption[];
  alternativeOptions: DOACOption[];
  avoidOptions: DOACOption[];
  alerts: Alert[];
  disclaimers: string[];
}
