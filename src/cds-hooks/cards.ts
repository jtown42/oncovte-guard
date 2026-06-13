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
import type { CdsCard, CdsIndicator } from "./types";
import { generateRecommendation } from "../core/recommendation";
import { checkDDIs } from "../core/ddi-checker";
import { DOAC_RXNORM_TO_NAME } from "../data/rxnorm-codes";

const SOURCE = {
  label: "OncoVTE Guard (NCCN VTE-B)",
  url: "https://www.nccn.org/guidelines/category_3",
};

const CLIP = 140;
function clip(s: string): string {
  return s.length <= CLIP ? s : `${s.slice(0, CLIP - 1)}…`;
}

function alertIndicator(level: "critical" | "warning" | "info"): CdsIndicator {
  return level; // levels already align 1:1 with CDS indicators
}

function severityIndicator(s: DDISeverity): CdsIndicator | null {
  if (s === "major") return "critical";
  if (s === "moderate" || s === "pharmacodynamic") return "warning";
  return null; // minor / none / unknown — not surfaced as a card
}

/* ---------- patient-view ---------- */

function summaryCard(
  patient: PatientData,
  rec: ProphylaxisRecommendation,
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

  const lines: string[] = [];
  if (!k.exclusion.isExcluded) {
    lines.push(
      `**Khorana score:** ${k.totalScore}/6 (${k.riskCategory}) — ${
        k.prophylaxisRecommended
          ? "at or above the NCCN threshold (≥2)"
          : "below the NCCN threshold (≥2)"
      }.`,
    );
  }
  if (preferred.length > 0) {
    lines.push(`**Preferred:** ${preferred.join(", ")}.`);
  }
  if (alt.length > 0) {
    lines.push(`**Alternative (LMWH):** ${alt.join(", ")}.`);
  }
  if (rec.renal) {
    lines.push(
      `**Renal:** CrCl ${rec.renal.crclMlMin} mL/min (${rec.renal.crclCategory}).`,
    );
  }
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

export function buildPatientViewCards(
  patient: PatientData,
  rec: ProphylaxisRecommendation = generateRecommendation(patient),
): CdsCard[] {
  const cards: CdsCard[] = [summaryCard(patient, rec)];

  for (const a of rec.alerts) {
    if (a.level === "info") continue; // folded into the summary detail
    cards.push({
      summary: clip(a.title),
      detail: a.detail,
      indicator: alertIndicator(a.level),
      source: { label: a.source },
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
          detail: `**Mechanism:** ${d.mechanism}\n\n**Recommendation:** ${d.recommendation}${
            d.alternativeDoac ? `\n\n**Prefer:** ${d.alternativeDoac}` : ""
          }`,
          indicator: ind,
          source: SOURCE,
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
          detail: `**Mechanism:** ${d.mechanism}\n\n**Recommendation:** ${d.recommendation}${
            d.alternativeDoac ? `\n\n**Prefer:** ${d.alternativeDoac}` : ""
          }`,
          indicator: ind,
          source: SOURCE,
        });
      }
    }
  }

  return cards;
}
