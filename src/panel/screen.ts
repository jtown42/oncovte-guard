/**
 * Panel screening (F20): run the unchanged engine across every patient in a
 * FHIR Bulk Data export and build a worklist of patients who meet the
 * prophylaxis threshold and have no active anticoagulant order.
 *
 * The only logic here outside the engine is that worklist filter (an RxNorm
 * lookup for an active anticoagulant). Every recommendation comes from
 * generateRecommendation(), the same function behind the app and CDS Hooks.
 */
import type { Bundle, FhirResource, Patient } from "fhir/r4";
import { assemblePatientData, type RawFHIRData } from "../fhir/fhir-parser";
import { generateRecommendation } from "../core/recommendation";
import { verdictText } from "../fhir-output/build";
import { RXNORM } from "../data/rxnorm-codes";

export const ANTICOAGULANT_RXNORM = new Set<string>([
  RXNORM.APIXABAN, RXNORM.RIVAROXABAN, RXNORM.DABIGATRAN, RXNORM.EDOXABAN,
  RXNORM.ENOXAPARIN, RXNORM.DALTEPARIN, RXNORM.HEPARIN_UFH, RXNORM.WARFARIN,
]);

export interface PanelRow {
  patient: string;
  id: string;
  cancer: string;
  khorana: number | "n/a";
  verdict: string;
  onAnticoagulant: boolean;
  /** Meets the threshold with an eligible agent, and no active anticoagulant order. */
  flagged: boolean;
}

export interface PanelResult {
  screened: number;
  /** Patients with an ICD-10-CM cancer Condition the parser recognizes. */
  withCancer: number;
  rows: PanelRow[];
}

const subjectId = (r: any): string | undefined =>
  (r.subject?.reference ?? r.patient?.reference)?.replace(/^Patient\//, "");
const asBundle = (rs: FhirResource[]): Bundle => ({ resourceType: "Bundle", type: "searchset", entry: rs.map((resource) => ({ resource })) });
const obsCategory = (o: any) => o.category?.[0]?.coding?.[0]?.code;

export function screenPanel(resources: FhirResource[], now: Date = new Date()): PanelResult {
  const byPatient = new Map<string, FhirResource[]>();
  for (const r of resources) {
    const id = r.resourceType === "Patient" ? r.id : subjectId(r);
    if (!id) continue;
    if (!byPatient.has(id)) byPatient.set(id, []);
    byPatient.get(id)!.push(r);
  }

  const rows: PanelRow[] = [];
  let screened = 0;
  for (const [, rs] of byPatient) {
    const patient = rs.find((r) => r.resourceType === "Patient") as Patient | undefined;
    if (!patient) continue;
    screened++;
    const of = (t: string) => rs.filter((r) => r.resourceType === t);
    const obs = of("Observation");
    const raw: RawFHIRData = {
      patient,
      conditions: asBundle(of("Condition")),
      labs: asBundle(obs.filter((o) => obsCategory(o) === "laboratory")),
      vitals: asBundle(obs.filter((o) => obsCategory(o) === "vital-signs")),
      medications: asBundle(of("MedicationRequest")),
    };
    const p = assemblePatientData(raw, now);
    if (p.activeCancerConditions.length === 0) continue;
    const rec = generateRecommendation(p);
    const onAnticoagulant = p.activeMedications.some((m) => ANTICOAGULANT_RXNORM.has(m.rxnormCode));
    const indicated =
      (rec.overallAction === "recommend" || rec.overallAction === "caution") &&
      rec.preferredOptions.length + rec.alternativeOptions.length > 0;
    rows.push({
      patient: p.name,
      id: p.id,
      cancer: p.activeCancerConditions[0].display,
      khorana: rec.overallAction === "excluded" ? "n/a" : rec.khorana.totalScore,
      verdict: verdictText(rec),
      onAnticoagulant,
      flagged: indicated && !onAnticoagulant,
    });
  }
  rows.sort(
    (a, b) => Number(b.flagged) - Number(a.flagged) ||
      (b.khorana === "n/a" ? -1 : b.khorana) - (a.khorana === "n/a" ? -1 : a.khorana) ||
      a.patient.localeCompare(b.patient),
  );
  return { screened, withCancer: rows.length, rows };
}
