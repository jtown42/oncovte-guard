/**
 * FHIR R4 -> PatientData transformer.
 * Source: plan/ddi-info.md Part 17 (parsing contracts).
 *
 * Each function tolerates missing/partial data (returns null rather than
 * throwing) so a sparse chart still yields a well-formed PatientData that the
 * clinical engines can reason about. Staleness is computed against a reference
 * date (default: now) using the same >30-day rule as the stale-lab module.
 */

import type {
  Patient,
  Bundle,
  BundleEntry,
  Condition,
  Observation,
  MedicationRequest,
  FhirResource,
} from "fhir/r4";

import type {
  CancerConditionItem,
  LabValue,
  MedicationItem,
  PatientData,
  PatientLabs,
} from "../types/patient";
import { CancerCategory } from "../types/khorana";
import { classifyIcd10, isCancerCode } from "../data/icd10-cancer-map";
import { LOINC } from "../data/loinc-codes";
import { isLabStale } from "../core/stale-lab";
import {
  ANTIPLATELET_RXNORM,
  ESA_RXNORM,
  IMID_RXNORM,
  NEPHROTOXIC_CHEMO_RXNORM,
} from "../data/rxnorm-codes";

const ICD10_SYSTEM = "http://hl7.org/fhir/sid/icd-10-cm";
const LOINC_SYSTEM = "http://loinc.org";
const RXNORM_SYSTEM = "http://www.nlm.nih.gov/research/umls/rxnorm";
const US_CORE_RACE =
  "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race";
const US_CORE_ETHNICITY =
  "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity";

/** The grouped raw resources returned by fetchPatientData / standalone loader. */
export interface RawFHIRData {
  patient: Patient;
  conditions: Bundle;
  labs: Bundle;
  vitals: Bundle;
  medications: Bundle;
}

/** Whole-year age from an ISO birthDate to a reference date. */
export function calculateAge(birthDate: string, now: Date = new Date()): number {
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return 0;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** Pull the display string out of a US Core race/ethnicity extension. */
function extractOmbDisplay(
  patient: Patient,
  extensionUrl: string,
): string | null {
  const ext = patient.extension?.find((e) => e.url === extensionUrl);
  const omb = ext?.extension?.find((e) => e.url === "ombCategory");
  return omb?.valueCoding?.display ?? null;
}

export interface Demographics {
  name: string;
  birthDate: string;
  age: number;
  gender: "male" | "female";
  race: string | null;
  ethnicity: string | null;
}

export function parsePatientDemographics(
  patient: Patient,
  now: Date = new Date(),
): Demographics {
  const name0 = patient.name?.[0];
  const given = name0?.given?.join(" ") ?? "";
  const family = name0?.family ?? "";
  const name = `${given} ${family}`.trim() || "Unknown";
  const birthDate = patient.birthDate ?? "";
  // FHIR allows "other"/"unknown"; the clinical engines only model male/female,
  // so anything non-female is treated as male for the Cockcroft-Gault factor.
  const gender: "male" | "female" = patient.gender === "female" ? "female" : "male";

  return {
    name,
    birthDate,
    age: birthDate ? calculateAge(birthDate, now) : 0,
    gender,
    race: extractOmbDisplay(patient, US_CORE_RACE),
    ethnicity: extractOmbDisplay(patient, US_CORE_ETHNICITY),
  };
}

/** Type-narrowing helpers over loosely-typed Bundle entries. */
function resources<T extends FhirResource>(
  bundle: Bundle | undefined,
  resourceType: T["resourceType"],
): T[] {
  const entries: BundleEntry[] = bundle?.entry ?? [];
  return entries
    .map((e) => e.resource)
    .filter((r): r is T => !!r && r.resourceType === resourceType);
}

export function parseConditions(bundle: Bundle): CancerConditionItem[] {
  const conditions = resources<Condition>(bundle, "Condition");
  const out: CancerConditionItem[] = [];
  for (const c of conditions) {
    const coding = c.code?.coding?.find((cd) => cd.system === ICD10_SYSTEM);
    const code = coding?.code;
    if (!code || !isCancerCode(code)) continue;
    const display = coding?.display ?? c.code?.text ?? code;
    out.push({ code, display, category: classifyIcd10(code).category });
  }
  return out;
}

/** Most-recent Observation matching a LOINC code, as a LabValue (or null). */
export function parseLatestLab(
  bundle: Bundle,
  loincCode: string,
  now: Date = new Date(),
): LabValue | null {
  const obs = resources<Observation>(bundle, "Observation").filter((o) =>
    o.code?.coding?.some(
      (cd) => cd.system === LOINC_SYSTEM && cd.code === loincCode,
    ),
  );
  if (obs.length === 0) return null;

  obs.sort((a, b) => effectiveTime(b) - effectiveTime(a));
  const latest = obs[0];
  const q = latest.valueQuantity;
  if (q?.value == null) return null;

  const date = latest.effectiveDateTime ?? "";
  return {
    value: q.value,
    unit: q.unit ?? q.code ?? "",
    date,
    loincCode,
    isStale: isLabStale(date, now),
  };
}

function effectiveTime(o: Observation): number {
  const d = o.effectiveDateTime ?? o.effectivePeriod?.start ?? "";
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function parseLabs(bundle: Bundle, now: Date = new Date()): PatientLabs {
  return {
    platelets: parseLatestLab(bundle, LOINC.PLATELETS, now),
    hemoglobin: parseLatestLab(bundle, LOINC.HEMOGLOBIN, now),
    wbc: parseLatestLab(bundle, LOINC.WBC, now),
    serumCreatinine: parseLatestLab(bundle, LOINC.SERUM_CREATININE, now),
    alt: parseLatestLab(bundle, LOINC.ALT, now),
    ast: parseLatestLab(bundle, LOINC.AST, now),
    totalBilirubin: parseLatestLab(bundle, LOINC.TOTAL_BILIRUBIN, now),
  };
}

export function parseMedications(bundle: Bundle): MedicationItem[] {
  const reqs = resources<MedicationRequest>(bundle, "MedicationRequest");
  const out: MedicationItem[] = [];
  for (const r of reqs) {
    if (r.status && r.status !== "active") continue;
    const coding = r.medicationCodeableConcept?.coding?.find(
      (cd) => cd.system === RXNORM_SYSTEM,
    );
    if (!coding?.code) continue;
    out.push({
      rxnormCode: coding.code,
      display: coding.display ?? r.medicationCodeableConcept?.text ?? coding.code,
      status: r.status ?? "unknown",
    });
  }
  return out;
}

export interface Vitals {
  weightKg: number | null;
  heightCm: number | null;
}

export function parseVitals(bundle: Bundle, now: Date = new Date()): Vitals {
  const weight = parseLatestLab(bundle, LOINC.BODY_WEIGHT, now);
  const height = parseLatestLab(bundle, LOINC.BODY_HEIGHT, now);

  let weightKg: number | null = null;
  if (weight) {
    const u = weight.unit.toLowerCase();
    weightKg =
      u === "lb" || u === "[lb_av]" ? round1(weight.value * 0.453592) : weight.value;
  }

  let heightCm: number | null = null;
  if (height) {
    const u = height.unit.toLowerCase();
    heightCm =
      u === "in" || u === "[in_i]" ? round1(height.value * 2.54) : height.value;
  }

  return { weightKg, heightCm };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** BMI from weight/height; null if either is missing or height is 0. */
export function computeBmi(
  weightKg: number | null,
  heightCm: number | null,
): number | null {
  if (weightKg == null || heightCm == null || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

function anyMedIn(meds: MedicationItem[], codes: Set<string>): boolean {
  return meds.some((m) => codes.has(m.rxnormCode));
}

/**
 * Assemble a complete PatientData from grouped raw FHIR resources. This is the
 * single seam consumed by generateRecommendation(); both the live SMART client
 * and the standalone synthetic loader feed it the same RawFHIRData shape.
 */
export function assemblePatientData(
  raw: RawFHIRData,
  now: Date = new Date(),
): PatientData {
  const demo = parsePatientDemographics(raw.patient, now);
  const labs = parseLabs(raw.labs, now);
  const vitals = parseVitals(raw.vitals, now);
  const medications = parseMedications(raw.medications);
  const activeCancerConditions = parseConditions(raw.conditions);
  const bmi = computeBmi(vitals.weightKg, vitals.heightCm);

  return {
    id: raw.patient.id ?? "unknown",
    name: demo.name,
    birthDate: demo.birthDate,
    age: demo.age,
    gender: demo.gender,
    race: demo.race,
    ethnicity: demo.ethnicity,
    weightKg: vitals.weightKg,
    heightCm: vitals.heightCm,
    bmi,
    activeCancerConditions,
    labs,
    activeMedications: medications,
    onESA: anyMedIn(medications, ESA_RXNORM),
    onAntiplatelet: anyMedIn(medications, ANTIPLATELET_RXNORM),
    onIMiD: anyMedIn(medications, IMID_RXNORM),
    hasNephrotoxicChemo: anyMedIn(medications, NEPHROTOXIC_CHEMO_RXNORM),
    // No reliable discrete FHIR signal for active major bleeding; it is a
    // clinician-assessed finding, so it defaults to false from parsed data.
    hasActiveMajorBleeding: false,
  };
}

/** Re-export so callers can discriminate the EXCLUDED path without importing khorana. */
export { CancerCategory };
