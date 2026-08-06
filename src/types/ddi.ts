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

/**
 * WS-3 (F12): per-cell evidence anchor. Converts the knowledge base from
 * KB-level *attested* (a uniform `sources` array on every agent) to *auditable*
 * for the cells that actually change a recommendation. `locator` must name a
 * table, section, or label subsection — not just a paper — so a reviewer can go
 * straight to the source. `claim` restates the specific assertion being sourced.
 */
export interface DDIEvidenceAnchor {
  source: string;
  locator: string;
  claim: string;
}

export interface DDIDetail {
  severity: DDISeverity;
  mechanism: string;
  recommendation: string;
  alternativeDoac: string | null;
  /**
   * Required (by the WS-3 validation test) for every `major` cell and for any
   * mechanism carrying a quantitative (digit-percentage) magnitude. Optional
   * elsewhere.
   */
  evidenceAnchor?: DDIEvidenceAnchor;
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

/**
 * WS-3: the knowledge base root carries version + review metadata so the UI and
 * CDS card can display provenance. `lastReviewed` is the last **curation** date
 * by the author — it is NOT a clinician sign-off (see F13); `provenanceNote`
 * states exactly what the sourcing is and is not.
 */
export interface DDIKnowledgeBase {
  kbVersion: string;
  lastReviewed: string;
  provenanceNote: string;
  agents: DDIEntry[];
}

export interface DDICheckResult {
  medication: string;
  rxnormCode: string;
  perDoac: DDIInteractions;
  worstSeverity: DDISeverity;
}
