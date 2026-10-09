/**
 * DOAC / LMWH renal dosing thresholds for the VTE PROPHYLAXIS indication in
 * ambulatory cancer patients.
 * Source: plan/ddi-info.md Part 2B (NCCN VTE-B) + ERRATA Issues 4 & 8.
 *
 * Per ERRATA Issue 4, dabigatran and edoxaban are NOT NCCN prophylaxis options;
 * they are still assessed here (ERRATA Issue 8 requires 6 entries) so the UI can
 * present a complete renal picture, but their `dose` makes the non-indication explicit.
 */

import type {
  AnticoagulantName,
  DOACRenalRecommendation,
  RenalRecommendationStatus,
} from "../types/renal";

/** The six anticoagulants the renal module always reports on (ERRATA Issue 8). */
export const ASSESSED_ANTICOAGULANTS: AnticoagulantName[] = [
  "apixaban",
  "rivaroxaban",
  "dabigatran",
  "edoxaban",
  "enoxaparin",
  "dalteparin",
];

/** NCCN-endorsed prophylaxis dose strings (apixaban/rivaroxaban) + LMWH regimens. */
export const PROPHYLAXIS_DOSES: Record<AnticoagulantName, string> = {
  apixaban: "2.5 mg PO BID",
  rivaroxaban: "10 mg PO daily",
  dabigatran: "Not an NCCN-supported ambulatory cancer VTE prophylaxis option",
  edoxaban: "Not an NCCN-supported ambulatory cancer VTE prophylaxis option",
  enoxaparin: "40 mg SC daily (weight-based regimen in pancreatic cancer)",
  dalteparin: "5,000 units SC daily (weight-based regimen in pancreatic cancer)",
};

/** CrCl threshold below which prophylaxis dosing changes (mL/min). */
export const SEVERE_CRCL_THRESHOLD = 30;

/**
 * CrCl below which apixaban is avoided for prophylaxis (end-stage range).
 * Between 15 and 30 it stays "caution". AVERT excluded CrCl <30, and there is
 * no prophylaxis evidence at end-stage renal function (OpenEvidence review 4).
 */
export const APIXABAN_AVOID_CRCL_LT = 15;

interface RuleOutput {
  recommendation: RenalRecommendationStatus;
  rationale: string;
}

/**
 * Per-agent renal rule for the prophylaxis indication (Part 2B). Returns the
 * recommendation status and a short rationale for a given CrCl.
 */
function ruleFor(agent: AnticoagulantName, crcl: number): RuleOutput {
  const severe = crcl < SEVERE_CRCL_THRESHOLD;
  switch (agent) {
    case "apixaban":
      if (crcl < APIXABAN_AVOID_CRCL_LT) {
        return {
          recommendation: "avoid",
          rationale:
            "CrCl <15 mL/min: no prophylaxis evidence at end-stage renal function — avoid.",
        };
      }
      return severe
        ? {
            recommendation: "caution",
            rationale:
              "CrCl 15–29 mL/min: limited data (patients with CrCl <30 were excluded from prophylaxis trials). Use with caution.",
          }
        : { recommendation: "standard", rationale: "No renal dose adjustment for prophylaxis." };
    case "rivaroxaban":
      return severe
        ? { recommendation: "avoid", rationale: "Avoid at CrCl <30 mL/min (NCCN VTE-B)." }
        : { recommendation: "standard", rationale: "No renal dose adjustment for prophylaxis." };
    case "dabigatran":
      return severe
        ? {
            recommendation: "avoid",
            rationale: "Avoid at CrCl <30 mL/min (renal clearance ~80%). Not an NCCN prophylaxis option.",
          }
        : {
            recommendation: "standard",
            rationale: "Reference only — not an NCCN ambulatory cancer prophylaxis option.",
          };
    case "edoxaban":
      return severe
        ? {
            recommendation: "avoid",
            rationale: "Avoid at CrCl <30 mL/min. Not an NCCN prophylaxis option.",
          }
        : {
            recommendation: "standard",
            rationale: "Reference only — not an NCCN ambulatory cancer prophylaxis option.",
          };
    case "enoxaparin":
    case "dalteparin":
      return severe
        ? { recommendation: "avoid", rationale: "Avoid LMWH at CrCl <30 mL/min (NCCN VTE-B)." }
        : { recommendation: "standard", rationale: "No renal dose adjustment for prophylaxis." };
  }
}

/** Build the renal recommendation for a single anticoagulant at a given CrCl. */
export function getAnticoagulantRenalRecommendation(
  agent: AnticoagulantName,
  crcl: number,
): DOACRenalRecommendation {
  const { recommendation, rationale } = ruleFor(agent, crcl);
  return {
    doac: agent,
    recommendation,
    dose: PROPHYLAXIS_DOSES[agent],
    rationale,
  };
}
