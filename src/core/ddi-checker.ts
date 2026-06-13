/**
 * DOAC-chemotherapy drug-drug interaction checker.
 *
 * Source of truth: plan/ddi-info.md Part 3 + plan/errata-contract-reconciliation.md.
 *   - ERRATA Issue 6: the knowledge base JSON is camelCase and matches DDIEntry.
 *   - ERRATA Issue 7: checkDDIs() always returns the full per-DOAC shape; the
 *     worst-severity ranking is major > moderate > pharmacodynamic > minor >
 *     none > unknown; getWorstDDIForDoac() aggregates across medications.
 */

import ddiKnowledgeBase from "../data/ddi-knowledge-base.json";
import {
  DOAC_NAMES,
  type DDICheckResult,
  type DDIDetail,
  type DDIEntry,
  type DDIInteractions,
  type DDISeverity,
  type DoacName,
} from "../types/ddi";

const KNOWLEDGE_BASE = ddiKnowledgeBase as DDIEntry[];

/** Index by RxNorm code for O(1) lookup. */
const BY_RXNORM: Map<string, DDIEntry> = new Map(
  KNOWLEDGE_BASE.map((entry) => [entry.rxnormCode, entry]),
);

/**
 * Severity ordering for "worst" selection (ERRATA Issue 7). Higher number =
 * more clinically significant. `unknown` ranks lowest so a known interaction
 * always dominates an unrecognized code, but is still distinguishable from
 * `none` for display.
 */
const SEVERITY_RANK: Record<DDISeverity, number> = {
  major: 5,
  moderate: 4,
  pharmacodynamic: 3,
  minor: 2,
  none: 1,
  unknown: 0,
};

/** Detail returned for a medication whose RxNorm code is not in the KB. */
function unknownDetail(): DDIDetail {
  return {
    severity: "unknown",
    mechanism: "No interaction data available for this medication.",
    recommendation:
      "Not found in the DDI knowledge base. Verify interactions manually.",
    alternativeDoac: null,
  };
}

/** Compare two severities; returns the more significant one. */
export function worseSeverity(a: DDISeverity, b: DDISeverity): DDISeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Reduce the four per-DOAC severities to the single worst one. */
function worstAcrossDoacs(interactions: DDIInteractions): DDISeverity {
  let worst: DDISeverity = "unknown";
  for (const doac of DOAC_NAMES) {
    worst = worseSeverity(worst, interactions[doac].severity);
  }
  return worst;
}

/**
 * Check one medication against all four DOACs.
 *
 * Always returns the full per-DOAC shape (ERRATA Issue 7). An unrecognized
 * RxNorm code yields `unknown` for every DOAC rather than throwing, so the
 * orchestration can surface "verify manually" instead of failing.
 */
export function checkDDIs(medication: {
  rxnormCode: string;
  display: string;
}): DDICheckResult {
  const entry = BY_RXNORM.get(medication.rxnormCode);

  if (!entry) {
    const perDoac: DDIInteractions = {
      apixaban: unknownDetail(),
      rivaroxaban: unknownDetail(),
      dabigatran: unknownDetail(),
      edoxaban: unknownDetail(),
    };
    return {
      medication: medication.display,
      rxnormCode: medication.rxnormCode,
      perDoac,
      worstSeverity: "unknown",
    };
  }

  return {
    medication: entry.agentName,
    rxnormCode: entry.rxnormCode,
    perDoac: entry.interactions,
    worstSeverity: worstAcrossDoacs(entry.interactions),
  };
}

/**
 * Given the DDI results for every active medication, return the worst severity
 * for one specific DOAC across all of them (ERRATA Issue 7). Used by the
 * orchestration to decide whether a DOAC is eligible.
 */
export function getWorstDDIForDoac(
  results: DDICheckResult[],
  doac: DoacName,
): DDISeverity {
  let worst: DDISeverity = "none";
  for (const result of results) {
    worst = worseSeverity(worst, result.perDoac[doac].severity);
  }
  return worst;
}
