/**
 * DOAC-chemotherapy drug-drug interaction types.
 * Source: plan/ddi-info.md Part 3 + ERRATA Issues 6 & 7.
 *
 * - The knowledge base JSON is camelCase and matches DDIEntry exactly (Issue 6).
 * - DDIEntry includes a `sources` field (Issue 6).
 * - checkDDIs() always returns the full per-DOAC DDICheckResult shape (Issue 7).
 */

export type DDISeverity =
  | "major"
  | "moderate"
  | "minor"
  | "none"
  | "pharmacodynamic"
  | "unknown";

/** The four DOACs are the columns of the DDI matrix. */
export type DoacName = "apixaban" | "rivaroxaban" | "dabigatran" | "edoxaban";

export const DOAC_NAMES: readonly DoacName[] = [
  "apixaban",
  "rivaroxaban",
  "dabigatran",
  "edoxaban",
];

export interface DDIDetail {
  severity: DDISeverity;
  mechanism: string;
  recommendation: string;
  alternativeDoac: string | null;
}

export type DDIInteractions = Record<DoacName, DDIDetail>;

export interface DDIEntry {
  agentName: string;
  brandName: string;
  rxnormCode: string;
  drugClass: string;
  pgpEffect: string;
  cyp3a4Effect: string;
  interactions: DDIInteractions;
  pharmacodynamicBleedingRisk: boolean;
  notes: string;
  sources: string[]; // ERRATA Issue 6: added to the interface
}

export interface DDICheckResult {
  medication: string;
  rxnormCode: string;
  perDoac: DDIInteractions;
  worstSeverity: DDISeverity;
}
