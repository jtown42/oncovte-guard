/**
 * Recommendation engine orchestration.
 *
 * Source of truth: plan/ddi-info.md Part 12 + plan/errata-contract-reconciliation.md.
 *   - ERRATA Issue 2: prophylaxis indicated when Khorana >= 2.
 *   - ERRATA Issue 4: only apixaban and rivaroxaban are presented as prophylaxis
 *     options; dabigatran/edoxaban are reference-only; if both DOACs are blocked,
 *     fall back to LMWH (never to dabigatran/edoxaban).
 *   - ERRATA Issue 8: renal recommendations are looked up via getRenalRecommendation.
 *   - ERRATA Issue 9: only a UNIVERSAL (appliesTo === "all") absolute
 *     contraindication aborts the pipeline; targeted ones block specific agents.
 *
 * This is the master function that ties every clinical module together. The UI
 * (Session 3) and CDS Hooks server consume the returned ProphylaxisRecommendation.
 */

import type { PatientData, LabValue } from "../types/patient";
import type {
  Alert,
  DOACOption,
  OverallAction,
  ProphylaxisRecommendation,
} from "../types/recommendation";
import type { Contraindication } from "../types/contraindication";
import type { DDICheckResult, DoacName } from "../types/ddi";
import type { RenalResult } from "../types/renal";
import { CancerCategory } from "../types/khorana";

import {
  getCancerCategory,
  calculateKhoranaScore,
} from "./khorana-engine";
import { checkDDIs, getWorstDDIForDoac } from "./ddi-checker";
import {
  assessRenalFunction,
  getRenalRecommendation,
} from "./renal-dosing";
import { detectContraindications } from "./contraindications";

const STANDARD_DISCLAIMERS = [
  "This tool provides clinical decision support only and does not replace clinical judgment.",
  "Recommendations are based on NCCN VTE-B guidance and published DOAC drug-interaction literature; verify against the most current guidelines.",
  "Confirm all medication, laboratory, and diagnosis data against the source record before acting.",
];

/** Prophylaxis dosing presentation per agent (Part 5). */
const DOAC_PRESENTATION: Record<
  string,
  { dose: string; route: string; frequency: string; duration: string }
> = {
  apixaban: {
    dose: "2.5 mg",
    route: "PO",
    frequency: "BID",
    duration: "Up to 6 months, longer if VTE risk persists",
  },
  rivaroxaban: {
    dose: "10 mg",
    route: "PO",
    frequency: "daily",
    duration: "Up to 6 months, longer if VTE risk persists",
  },
  enoxaparin: {
    dose: "1 mg/kg",
    route: "SC",
    frequency: "daily",
    duration: "x3 months, then 40 mg SC daily",
  },
  dalteparin: {
    dose: "200 units/kg",
    route: "SC",
    frequency: "daily",
    duration: "x1 month, then 150 units/kg SC daily",
  },
};

const PROPHYLAXIS_DOACS: DoacName[] = ["apixaban", "rivaroxaban"];
const REFERENCE_DOACS: DoacName[] = ["dabigatran", "edoxaban"];
const LMWH_AGENTS = ["enoxaparin", "dalteparin"] as const;

function targetedBlocks(
  targeted: Contraindication[],
  agent: string,
): Contraindication | undefined {
  return targeted.find(
    (c) => Array.isArray(c.appliesTo) && c.appliesTo.includes(agent as never),
  );
}

/** Build the option object for one of the four DOACs. */
function buildDoacOption(
  doac: DoacName,
  renalResult: RenalResult,
  ddiResults: DDICheckResult[],
  targetedAbsolute: Contraindication[],
): DOACOption {
  const hasNccnProphylaxisIndication = PROPHYLAXIS_DOACS.includes(doac);
  const renalRec = getRenalRecommendation(renalResult, doac);
  const renalStatus = renalRec?.recommendation ?? "avoid";
  const worstDDI = getWorstDDIForDoac(ddiResults, doac);
  const block = targetedBlocks(targetedAbsolute, doac);

  let eligible = hasNccnProphylaxisIndication;
  let ineligibleReason: string | null = null;

  if (!hasNccnProphylaxisIndication) {
    ineligibleReason =
      "Not an NCCN-supported ambulatory cancer VTE prophylaxis option (DDI reference only).";
    eligible = false;
  } else if (block) {
    ineligibleReason = block.detail;
    eligible = false;
  } else if (renalStatus === "avoid") {
    ineligibleReason = renalRec?.rationale ?? "Renal function precludes use.";
    eligible = false;
  } else if (worstDDI === "major") {
    ineligibleReason = "Major drug-drug interaction with active therapy — avoid.";
    eligible = false;
  }

  const present = DOAC_PRESENTATION[doac];
  return {
    name: doac,
    dose: present?.dose ?? "",
    route: present?.route ?? "",
    frequency: present?.frequency ?? "",
    duration: present?.duration ?? "",
    renalStatus,
    worstDDI,
    eligible,
    ineligibleReason,
    hasNccnProphylaxisIndication,
  };
}

/** Build an LMWH option (no per-DOAC DDI; renal + targeted contraindications apply). */
function buildLmwhOption(
  agent: (typeof LMWH_AGENTS)[number],
  renalResult: RenalResult,
  targetedAbsolute: Contraindication[],
): DOACOption {
  const renalRec = getRenalRecommendation(renalResult, agent);
  const renalStatus = renalRec?.recommendation ?? "avoid";
  const block = targetedBlocks(targetedAbsolute, agent);

  let eligible = true;
  let ineligibleReason: string | null = null;
  if (block) {
    eligible = false;
    ineligibleReason = block.detail; // e.g. HIT blocks LMWH
  } else if (renalStatus === "avoid") {
    eligible = false;
    ineligibleReason = renalRec?.rationale ?? "Renal function precludes use.";
  }

  const present = DOAC_PRESENTATION[agent];
  return {
    name: agent,
    dose: present?.dose ?? "",
    route: present?.route ?? "",
    frequency: present?.frequency ?? "",
    duration: present?.duration ?? "",
    renalStatus,
    worstDDI: "none",
    eligible,
    ineligibleReason,
    hasNccnProphylaxisIndication: false,
  };
}

function staleLabs(patient: PatientData): { fields: string[]; any: boolean } {
  const entries: [string, LabValue | null][] = [
    ["platelets", patient.labs.platelets],
    ["hemoglobin", patient.labs.hemoglobin],
    ["wbc", patient.labs.wbc],
    ["serumCreatinine", patient.labs.serumCreatinine],
  ];
  const fields = entries
    .filter(([, lab]) => lab !== null && lab.isStale)
    .map(([name]) => name);
  return { fields, any: fields.length > 0 };
}

/**
 * Generate a full VTE prophylaxis recommendation for a patient.
 *
 * Returns early with a defined `overallAction` for the excluded, not-indicated,
 * and (universally) contraindicated pathways; otherwise assembles the full
 * option list, alerts, and disclaimers.
 */
export function generateRecommendation(
  patient: PatientData,
): ProphylaxisRecommendation {
  const alerts: Alert[] = [];

  // STEP 1: Khorana exclusion takes precedence.
  const resolved = getCancerCategory(patient.activeCancerConditions);

  // STEP 2: Khorana score.
  const khorana = calculateKhoranaScore({
    cancerCategory: resolved.category,
    exclusionReason: resolved.exclusionReason,
    plateletCount: patient.labs.platelets?.value ?? null,
    hemoglobin: patient.labs.hemoglobin?.value ?? null,
    onESA: patient.onESA,
    wbcCount: patient.labs.wbc?.value ?? null,
    bmi: patient.bmi,
    cancerSiteLabel: resolved.label,
  });

  // Always compute these so the result object is fully populated even on early return.
  const contraindications = detectContraindications({
    conditions: patient.activeCancerConditions,
    plateletCount: patient.labs.platelets?.value ?? null,
    weightKg: patient.weightKg,
    onAntiplatelet: patient.onAntiplatelet,
    onIMiD: patient.onIMiD,
    totalBilirubin: patient.labs.totalBilirubin?.value ?? null,
    alt: patient.labs.alt?.value ?? null,
    ast: patient.labs.ast?.value ?? null,
  });

  const ddiResults = patient.activeMedications.map((m) =>
    checkDDIs({ rxnormCode: m.rxnormCode, display: m.display }),
  );

  const renal =
    patient.weightKg != null && patient.labs.serumCreatinine != null
      ? assessRenalFunction({
          age: patient.age,
          weightKg: patient.weightKg,
          gender: patient.gender,
          serumCreatinine: patient.labs.serumCreatinine.value,
          bmi: patient.bmi,
          medications: patient.activeMedications.map((m) => ({
            rxnormCode: m.rxnormCode,
          })),
        })
      : null;

  const stale = staleLabs(patient);

  const base = {
    khorana,
    renal,
    ddiResults,
    contraindications,
    staleLabWarning: stale.any,
    staleLabFields: stale.fields,
    disclaimers: STANDARD_DISCLAIMERS,
  };

  // STEP 1 (return): excluded population.
  if (resolved.category === CancerCategory.EXCLUDED) {
    const exclusionAlerts: Alert[] = [
      {
        level: "info",
        title: "Khorana score not applicable",
        detail: `${resolved.label}: this population follows a disease-specific VTE pathway (NCCN VTE-2). Individualized assessment required.`,
        source: "NCCN VTE-2",
      },
    ];
    // Myeloma on an IMiD is not "no prophylaxis" — it follows a myeloma-specific
    // pathway. Point the clinician there rather than leaving a bare exclusion.
    if (resolved.exclusionReason === "multiple_myeloma" && patient.onIMiD) {
      exclusionAlerts.push({
        level: "info",
        title: "Myeloma on an IMiD — use myeloma-specific VTE prophylaxis",
        detail:
          "IMiD-based therapy raises VTE risk. Prophylaxis (aspirin, LMWH, or prophylactic-dose apixaban depending on risk) is guided by myeloma-specific recommendations (NCCN MM / ITAC), not by the Khorana score.",
        source: "NCCN MM / ITAC",
      });
    }
    return {
      ...base,
      overallAction: "excluded",
      preferredOptions: [],
      alternativeOptions: [],
      avoidOptions: [],
      alerts: exclusionAlerts,
    };
  }

  // STEP 3: prophylaxis indicated only at Khorana >= 2 (ERRATA Issue 2).
  if (khorana.totalScore < 2) {
    return {
      ...base,
      overallAction: "not_indicated",
      preferredOptions: [],
      alternativeOptions: [],
      avoidOptions: [],
      alerts: [
        {
          level: "info",
          title: "Routine pharmacologic prophylaxis not indicated",
          detail: `Khorana score ${khorana.totalScore} (${khorana.riskCategory}) is below the NCCN threshold (>=2) for routine ambulatory prophylaxis.`,
          source: "NCCN VTE-B",
        },
      ],
    };
  }

  // STEP 4: universal absolute contraindication aborts the pipeline (Issue 9).
  const universalAbsolute = contraindications.absolute.filter(
    (c) => c.appliesTo === "all",
  );
  const targetedAbsolute = contraindications.absolute.filter(
    (c) => c.appliesTo !== "all",
  );

  if (universalAbsolute.length > 0) {
    return {
      ...base,
      overallAction: "contraindicated",
      preferredOptions: [],
      alternativeOptions: [],
      avoidOptions: [],
      alerts: universalAbsolute.map((c) => ({
        level: "critical" as const,
        title: "Absolute contraindication to anticoagulation",
        detail: c.detail,
        source: "NCCN VTE-B",
      })),
    };
  }

  // STEP 5-7: build options. Renal must exist to dose; if missing, treat as avoid.
  const renalForOptions: RenalResult =
    renal ?? {
      crclMlMin: 0,
      crclCategory: "severe",
      doacRecommendations: [],
      warnings: ["renal_data_unavailable"],
    };

  const prophylaxisOptions = PROPHYLAXIS_DOACS.map((d) =>
    buildDoacOption(d, renalForOptions, ddiResults, targetedAbsolute),
  );
  const referenceOptions = REFERENCE_DOACS.map((d) =>
    buildDoacOption(d, renalForOptions, ddiResults, targetedAbsolute),
  );
  const lmwhOptions = LMWH_AGENTS.map((a) =>
    buildLmwhOption(a, renalForOptions, targetedAbsolute),
  );

  const preferredOptions: DOACOption[] = prophylaxisOptions.filter(
    (o) => o.eligible,
  );
  const blockedDoacs: DOACOption[] = prophylaxisOptions.filter(
    (o) => !o.eligible,
  );

  const eligibleLmwh = lmwhOptions.filter((o) => o.eligible);
  const blockedLmwh = lmwhOptions.filter((o) => !o.eligible);

  // STEP 8: if both DOACs are blocked, LMWH becomes the recommendation
  // (never fall back to dabigatran/edoxaban — ERRATA Issue 4).
  const bothDoacsBlocked = preferredOptions.length === 0;
  const alternativeOptions: DOACOption[] = eligibleLmwh;
  if (bothDoacsBlocked && eligibleLmwh.length > 0) {
    alerts.push({
      level: "warning",
      title: "DOAC prophylaxis blocked — LMWH recommended",
      detail:
        "Both apixaban and rivaroxaban are blocked (major DDI, renal, or targeted contraindication). Recommend LMWH; do not substitute dabigatran or edoxaban.",
      source: "NCCN VTE-B",
    });
  }

  // dabigatran/edoxaban and any blocked agents are surfaced as avoid (not options).
  const avoidOptions: DOACOption[] = [
    ...blockedDoacs,
    ...referenceOptions,
    ...blockedLmwh,
  ];

  // STEP 10: compile alerts.
  // Cancer-site risk-model caveat (e.g. kidney classification, weak Khorana
  // discrimination in lung cancer). Computed during classification; surfaced
  // here so it accompanies an active recommendation.
  if (resolved.note) {
    alerts.push({
      level: "info",
      title: "Cancer-site risk-model caveat",
      detail: resolved.note,
      source: "OncoVTE Guard",
    });
  }
  appendDdiAlerts(ddiResults, alerts);
  appendRenalAlerts(renal, alerts);
  appendContraindicationAlerts(contraindications.relative, alerts);
  if (stale.any) {
    alerts.push({
      level: "warning",
      title: "Stale laboratory data",
      detail: `These labs are older than 30 days: ${stale.fields.join(
        ", ",
      )}. Re-check before acting.`,
      source: "OncoVTE Guard",
    });
  }

  // Overall action.
  let overallAction: OverallAction = "recommend";
  if (preferredOptions.length === 0 && eligibleLmwh.length === 0) {
    overallAction = "caution";
  } else if (contraindications.relative.length > 0) {
    overallAction = "caution";
  }

  return {
    ...base,
    overallAction,
    preferredOptions,
    alternativeOptions,
    avoidOptions,
    alerts,
  };
}

function appendDdiAlerts(results: DDICheckResult[], alerts: Alert[]): void {
  for (const r of results) {
    if (r.worstSeverity === "major") {
      alerts.push({
        level: "critical",
        title: `Major DOAC interaction: ${r.medication}`,
        detail: `${r.medication} has a major interaction with one or more DOACs. Review the DDI matrix; LMWH may be preferred.`,
        source: "DOAC DDI knowledge base",
      });
    } else if (r.worstSeverity === "moderate") {
      alerts.push({
        level: "warning",
        title: `Moderate DOAC interaction: ${r.medication}`,
        detail: `${r.medication} has a moderate interaction with one or more DOACs. Monitor closely.`,
        source: "DOAC DDI knowledge base",
      });
    } else if (r.worstSeverity === "pharmacodynamic") {
      alerts.push({
        level: "warning",
        title: `Additive bleeding risk: ${r.medication}`,
        detail: `${r.medication} contributes pharmacodynamic bleeding risk independent of DOAC levels. Counsel and monitor.`,
        source: "AHA 2022 Scientific Statement",
      });
    }
  }
}

function appendRenalAlerts(renal: RenalResult | null, alerts: Alert[]): void {
  if (!renal) {
    alerts.push({
      level: "warning",
      title: "Renal function not assessable",
      detail:
        "Weight and/or serum creatinine missing — CrCl could not be calculated. Obtain before dosing.",
      source: "OncoVTE Guard",
    });
    return;
  }
  if (renal.crclMlMin < 30) {
    alerts.push({
      level: "critical",
      title: "Severe renal impairment (CrCl <30 mL/min)",
      detail:
        "Avoid rivaroxaban and LMWH; apixaban only with caution. Consider UFH or specialist input.",
      source: "NCCN VTE-B",
    });
  } else if (renal.crclMlMin < 50) {
    alerts.push({
      level: "warning",
      title: "Reduced renal function (CrCl 30-49 mL/min)",
      detail: "Dose-adjust and monitor renal function during therapy.",
      source: "NCCN VTE-B",
    });
  }
  if (renal.warnings.includes("nephrotoxic_chemotherapy")) {
    alerts.push({
      level: "warning",
      title: "Nephrotoxic chemotherapy active",
      detail:
        "An active nephrotoxic agent (e.g. cisplatin) may reduce CrCl. Recheck renal function during therapy.",
      source: "OncoVTE Guard",
    });
  }
  if (renal.warnings.includes("sarcopenia")) {
    alerts.push({
      level: "info",
      title: "Low body weight (<60 kg)",
      detail:
        "Cockcroft-Gault may overestimate clearance in cachectic patients. Interpret CrCl with caution.",
      source: "OncoVTE Guard",
    });
  }
}

function appendContraindicationAlerts(
  relative: Contraindication[],
  alerts: Alert[],
): void {
  for (const c of relative) {
    alerts.push({
      level: "warning",
      title: "Relative caution",
      detail: c.detail,
      source: "NCCN VTE-B",
    });
  }
}
