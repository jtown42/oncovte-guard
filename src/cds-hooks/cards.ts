/**
 * Translate the clinical engine output into CDS Hooks cards.
 *
 * patient-view  → buildPatientViewCards: a summary card for the overall action
 *                 plus one card per critical/warning alert.
 * order-select  → buildOrderSelectCards: real-time DOAC interaction checks for
 *                 the order(s) being composed.
 */
import type { PatientData, MedicationItem } from "../types/patient";
import type { ProphylaxisRecommendation } from "../types/recommendation";
import type { DDISeverity, DoacName } from "../types/ddi";
import type { CdsCard, CdsIndicator, CdsOverrideReason } from "./types";

/**
 * WS-4 role tailoring. Interruptive modal pop-ups had the lowest acceptance of
 * any CDS design studied; role tailoring was the only variant shown to measurably
 * improve prescriber acceptance. `pharmacist` emphasizes DDI mechanism + renal
 * dosing detail; `oncologist` (and the default `app`) emphasize the verdict and
 * the option choice.
 */
export type CardRole = "oncologist" | "pharmacist" | "app";

/** WS-4: fixed override-reason vocabulary (kept small so /metrics can aggregate it). */
export const OVERRIDE_REASONS: CdsOverrideReason[] = [
  { code: "clinically_inappropriate", display: "Clinically inappropriate" },
  { code: "already_addressed", display: "Already addressed" },
  { code: "data_inaccurate", display: "Data inaccurate" },
  { code: "patient_preference", display: "Patient preference" },
  { code: "other", display: "Other" },
];
import { generateRecommendation } from "../core/recommendation";
import {
  checkDDIs,
  DDI_KB_VERSION,
  DDI_KB_LAST_REVIEWED,
} from "../core/ddi-checker";
import { DOAC_RXNORM_TO_NAME } from "../data/rxnorm-codes";
import type { DDIDetail } from "../types/ddi";

const SOURCE = {
  label: "OncoVTE Guard (NCCN VTE-B)",
  url: "https://www.nccn.org/guidelines/category_3",
};

const CLIP = 140;
function clip(s: string): string {
  return s.length <= CLIP ? s : `${s.slice(0, CLIP - 1)}…`;
}

function severityIndicator(s: DDISeverity): CdsIndicator | null {
  if (s === "major") return "critical";
  if (s === "moderate" || s === "pharmacodynamic") return "warning";
  return null; // minor / none / unknown — not surfaced as a card
}

/** WS-3: KB provenance footer surfaced on every DDI card detail. */
const KB_FOOTER = `_DDI KB v${DDI_KB_VERSION}, curated ${DDI_KB_LAST_REVIEWED} (curation date, not clinician sign-off)._`;

/** Build the detail body for one DOAC interaction, including its evidence anchor (WS-3). */
function ddiDetailText(d: DDIDetail): string {
  const parts = [
    `**Mechanism:** ${d.mechanism}`,
    `**Recommendation:** ${d.recommendation}`,
  ];
  if (d.alternativeDoac) parts.push(`**Prefer:** ${d.alternativeDoac}`);
  if (d.evidenceAnchor) {
    parts.push(
      `**Evidence:** ${d.evidenceAnchor.source} — ${d.evidenceAnchor.locator}`,
    );
  }
  parts.push(KB_FOOTER);
  return parts.join("\n\n");
}

/* ---------- patient-view ---------- */

function summaryCard(
  patient: PatientData,
  rec: ProphylaxisRecommendation,
  role: CardRole = "app",
): CdsCard {
  const k = rec.khorana;
  const indicator: CdsIndicator =
    rec.overallAction === "contraindicated"
      ? "critical"
      : rec.overallAction === "caution"
        ? "warning"
        : "info";

  const preferred = rec.preferredOptions.map((o) => o.name);
  const alt = rec.alternativeOptions.map((o) => o.name);

  const khoranaLine = !k.exclusion.isExcluded
    ? `**Khorana score:** ${k.totalScore}/6 (${k.riskCategory}) — ${
        k.prophylaxisRecommended
          ? "at or above the NCCN threshold (≥2)"
          : "below the NCCN threshold (≥2)"
      }.`
    : null;
  const verdictLines: string[] = [];
  if (khoranaLine) verdictLines.push(khoranaLine);
  if (preferred.length > 0) verdictLines.push(`**Preferred:** ${preferred.join(", ")}.`);
  if (alt.length > 0) verdictLines.push(`**Alternative (LMWH):** ${alt.join(", ")}.`);

  // Pharmacist-oriented detail: DDI mechanism + renal dosing specifics.
  const pharmLines: string[] = [];
  if (rec.renal) {
    pharmLines.push(
      `**Renal:** CrCl ${rec.renal.crclMlMin} mL/min (${rec.renal.crclCategory}).`,
    );
  }
  const worstDdi = rec.ddiResults.find((r) => r.worstSeverity === "major");
  if (worstDdi) {
    pharmLines.push(
      `**Interaction:** ${worstDdi.medication} — major with a DOAC; review the DDI matrix.`,
    );
  }
  if (rec.bleedingRisk.tier === "elevated") {
    pharmLines.push(
      `**Bleeding-risk factors:** ${rec.bleedingRisk.factors.map((f) => f.label).join("; ")}.`,
    );
  }

  // Role tailoring: prescribers lead with the verdict; pharmacists lead with the
  // mechanism/dosing detail. `app` shows both in the natural order.
  const lines: string[] =
    role === "pharmacist"
      ? [...pharmLines, ...verdictLines]
      : [...verdictLines, ...pharmLines];
  if (rec.staleLabWarning) {
    lines.push(
      `_Note: labs older than 30 days (${rec.staleLabFields.join(", ")})._`,
    );
  }

  const summaryText = clip(
    `${patient.name}: ${
      rec.overallAction === "recommend"
        ? `VTE prophylaxis recommended${preferred.length ? ` (${preferred.join("/")})` : ""}`
        : rec.overallAction === "caution"
          ? "VTE prophylaxis indicated — review cautions"
          : rec.overallAction === "contraindicated"
            ? "Anticoagulation contraindicated"
            : rec.overallAction === "excluded"
              ? "Khorana not applicable — disease-specific VTE pathway"
              : "Routine VTE prophylaxis not indicated"
    }`,
  );

  return {
    summary: summaryText,
    detail: lines.join("\n\n"),
    indicator,
    source: SOURCE,
  };
}

/**
 * WS-4 two-channel alert model. Only **critical** alerts emit their own
 * interruptive card (each carrying override-reason capture). All **warning /
 * info** alerts collapse into the single non-interruptive summary card as an
 * "N additional considerations" section — so a 1-critical + 4-non-critical
 * patient produces two cards, not five. This is the smallest credible version
 * of the tiering the CDS alert-fatigue literature calls for.
 */
export function buildPatientViewCards(
  patient: PatientData,
  rec: ProphylaxisRecommendation = generateRecommendation(patient),
  role: CardRole = "app",
): CdsCard[] {
  const summary = summaryCard(patient, rec, role);

  const critical = rec.alerts.filter((a) => a.level === "critical");
  const nonCritical = rec.alerts.filter((a) => a.level !== "critical");

  // Collapse non-critical alerts into the summary card (non-interruptive).
  if (nonCritical.length > 0) {
    const n = nonCritical.length;
    const items = nonCritical
      .map((a) => `- _${a.level}_ — **${a.title}**: ${a.detail}`)
      .join("\n");
    summary.detail = `${summary.detail}\n\n**${n} additional consideration${
      n === 1 ? "" : "s"
    }** (non-interruptive):\n${items}`;
  }

  const cards: CdsCard[] = [summary];

  // Each critical alert is interruptive and captures an override reason.
  for (const a of critical) {
    cards.push({
      summary: clip(a.title),
      detail: a.detail,
      indicator: "critical",
      source: { label: a.source },
      overrideReasons: OVERRIDE_REASONS,
    });
  }

  return cards;
}

/* ---------- order-select ---------- */

function activeDoacs(meds: MedicationItem[]): { code: string; name: DoacName }[] {
  const out: { code: string; name: DoacName }[] = [];
  for (const m of meds) {
    const name = DOAC_RXNORM_TO_NAME[m.rxnormCode];
    if (name) out.push({ code: m.rxnormCode, name });
  }
  return out;
}

/**
 * Screen the order(s) being composed for DOAC interactions.
 *
 *   - Ordering a DOAC → screen the patient's active medications against it.
 *   - Ordering another agent (e.g. chemotherapy) → screen it against the
 *     patient's active DOAC(s).
 */
export function buildOrderSelectCards(
  patient: PatientData,
  orderedMeds: { rxnormCode: string; display: string }[],
): CdsCard[] {
  const cards: CdsCard[] = [];
  const onDoacs = activeDoacs(patient.activeMedications);

  for (const order of orderedMeds) {
    const orderedDoac = DOAC_RXNORM_TO_NAME[order.rxnormCode];

    // F5 (WS-5): dabigatran / edoxaban are not NCCN-supported ambulatory cancer
    // VTE prophylaxis options — advise against ordering them for this indication.
    if (orderedDoac === "dabigatran" || orderedDoac === "edoxaban") {
      cards.push({
        summary: clip(
          `${orderedDoac} is not an NCCN-supported cancer VTE prophylaxis option`,
        ),
        detail:
          `**${orderedDoac}** is not an NCCN-supported option for ambulatory cancer VTE prophylaxis; only apixaban and rivaroxaban are (with LMWH as the fallback).` +
          (orderedDoac === "dabigatran"
            ? " Per the ACC Scientific Statement, dabigatran has not been evaluated in patients with cancer-associated thrombosis and is not recommended in this setting."
            : ""),
        indicator: "warning",
        source: SOURCE,
        overrideReasons: OVERRIDE_REASONS,
      });
    }

    if (orderedDoac) {
      // Ordering an anticoagulant — check existing therapy against it.
      for (const med of patient.activeMedications) {
        const res = checkDDIs(med);
        const sev = res.perDoac[orderedDoac].severity;
        const ind = severityIndicator(sev);
        if (!ind) continue;
        const d = res.perDoac[orderedDoac];
        cards.push({
          summary: clip(
            `${sev.toUpperCase()} interaction: ${orderedDoac} + ${res.medication}`,
          ),
          detail: ddiDetailText(d),
          indicator: ind,
          source: SOURCE,
          overrideReasons: ind === "critical" ? OVERRIDE_REASONS : undefined,
        });
      }
    } else {
      // Ordering another agent — check it against the patient's active DOAC(s).
      const res = checkDDIs(order);
      for (const doac of onDoacs) {
        const d = res.perDoac[doac.name];
        const ind = severityIndicator(d.severity);
        if (!ind) continue;
        const sev = d.severity;
        cards.push({
          summary: clip(
            `${sev.toUpperCase()} interaction: ${order.display} + ${doac.name}`,
          ),
          detail: ddiDetailText(d),
          indicator: ind,
          source: SOURCE,
          overrideReasons: ind === "critical" ? OVERRIDE_REASONS : undefined,
        });
      }
    }
  }

  return cards;
}
