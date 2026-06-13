/**
 * Interactive "what-if" scenario model for the standalone demo.
 *
 * A Scenario is a flat, editable view of the inputs that drive the clinical
 * engines. `scenarioToPatient` rebuilds a real `PatientData` from it — deriving
 * the same flags (onAntiplatelet / onIMiD / hasNephrotoxicChemo / onESA) the
 * FHIR parser derives, using the same RxNorm sets — so the live dashboard runs
 * the identical `generateRecommendation` pipeline. Nothing here re-implements
 * clinical logic; it only assembles inputs.
 */

import type {
  PatientData,
  LabValue,
  MedicationItem,
  CancerConditionItem,
} from "../types/patient";
import { classifyIcd10 } from "../data/icd10-cancer-map";
import { LOINC } from "../data/loinc-codes";
import {
  ANTIPLATELET_RXNORM,
  IMID_RXNORM,
  NEPHROTOXIC_CHEMO_RXNORM,
  ESA_RXNORM,
} from "../data/rxnorm-codes";
import rawKb from "../data/ddi-knowledge-base.json";

export interface Scenario {
  name: string;
  age: number;
  gender: "male" | "female";
  weightKg: number;
  bmi: number;
  conditionCode: string;
  platelets: number | null;
  hemoglobin: number | null;
  wbc: number | null;
  serumCreatinine: number | null;
  totalBilirubin: number | null;
  alt: number | null;
  ast: number | null;
  onESA: boolean;
  medCodes: string[];
}

/* ---------- selectable cancer sites (one per Khorana category + exclusions) ---------- */

export interface CancerOption {
  code: string;
  label: string;
}

export const CANCER_OPTIONS: CancerOption[] = [
  { code: "C25.1", label: "Pancreatic — very high (2 pts)" },
  { code: "C16.9", label: "Gastric — very high (2 pts)" },
  { code: "C34.1", label: "Lung — high (1 pt)" },
  { code: "C83.1", label: "Non-Hodgkin lymphoma — high (1 pt)" },
  { code: "C81.9", label: "Hodgkin lymphoma — high (1 pt)" },
  { code: "C56.9", label: "Ovarian — high (1 pt)" },
  { code: "C54.1", label: "Uterine — high (1 pt)" },
  { code: "C67.9", label: "Bladder — high (1 pt)" },
  { code: "C62.9", label: "Testicular — high (1 pt)" },
  { code: "C64.9", label: "Kidney/renal — high* (1 pt)" },
  { code: "C18.9", label: "Colon — standard (0 pts)" },
  { code: "C50.9", label: "Breast — standard (0 pts)" },
  { code: "C61", label: "Prostate — standard (0 pts)" },
  { code: "C90.00", label: "Multiple myeloma — excluded" },
  { code: "C71.9", label: "Primary brain tumor — excluded" },
  { code: "C92.00", label: "Acute myeloid leukemia — excluded" },
  { code: "D45", label: "Polycythemia vera / MPN — excluded" },
];

/* ---------- medication catalog (DDI KB agents + flag-driving extras) ---------- */

export interface MedOption {
  code: string;
  label: string;
  group: string;
}

const KB = rawKb as {
  agentName: string;
  brandName?: string;
  rxnormCode: string;
  drugClass: string;
}[];

/** Agents not in the DDI KB but worth offering because they drive a flag/contraindication. */
const EXTRA_AGENTS: MedOption[] = [
  { code: "1191", label: "Aspirin", group: "Antiplatelet" },
  { code: "32968", label: "Clopidogrel", group: "Antiplatelet" },
  { code: "613391", label: "Prasugrel", group: "Antiplatelet" },
  { code: "1116632", label: "Ticagrelor", group: "Antiplatelet" },
  { code: "321191", label: "Lenalidomide", group: "IMiD" },
  { code: "1369409", label: "Pomalidomide", group: "IMiD" },
  { code: "10400", label: "Thalidomide", group: "IMiD" },
  { code: "3521", label: "Epoetin alfa (ESA)", group: "ESA" },
  { code: "2555", label: "Cisplatin", group: "Nephrotoxic chemo" },
  { code: "40048", label: "Carboplatin", group: "Nephrotoxic chemo" },
  { code: "6851", label: "Methotrexate", group: "Nephrotoxic chemo" },
];

/** Full add-a-med catalog: every KB agent, plus extras not already present. */
export const MED_CATALOG: MedOption[] = (() => {
  const byCode = new Map<string, MedOption>();
  for (const e of KB) {
    byCode.set(e.rxnormCode, {
      code: e.rxnormCode,
      label: e.agentName,
      group: e.drugClass || "Antineoplastic / supportive",
    });
  }
  for (const x of EXTRA_AGENTS) {
    if (!byCode.has(x.code)) byCode.set(x.code, x);
  }
  return [...byCode.values()].sort((a, b) => a.label.localeCompare(b.label));
})();

const MED_BY_CODE = new Map(MED_CATALOG.map((m) => [m.code, m]));

export function medLabel(code: string): string {
  return MED_BY_CODE.get(code)?.label ?? `RxNorm ${code}`;
}

/** Catalog grouped by `group`, for <optgroup> rendering. */
export function medGroups(): { group: string; options: MedOption[] }[] {
  const groups = new Map<string, MedOption[]>();
  for (const m of MED_CATALOG) {
    const list = groups.get(m.group) ?? [];
    list.push(m);
    groups.set(m.group, list);
  }
  return [...groups.entries()]
    .map(([group, options]) => ({ group, options }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

/* ---------- conversions ---------- */

function lab(
  value: number | null,
  loincCode: string,
  unit: string,
): LabValue | null {
  if (value == null || Number.isNaN(value)) return null;
  // Editor values are treated as freshly entered, so never stale.
  return { value, unit, date: new Date().toISOString(), loincCode, isStale: false };
}

/** Build a fully-formed PatientData from an editable Scenario. */
export function scenarioToPatient(s: Scenario): PatientData {
  const cls = classifyIcd10(s.conditionCode);
  const conditions: CancerConditionItem[] = [
    { code: s.conditionCode, display: cls.label, category: cls.category },
  ];

  const meds: MedicationItem[] = s.medCodes.map((code) => ({
    rxnormCode: code,
    display: medLabel(code),
    status: "active",
  }));

  // Coherent height from weight + BMI so the banner reads sensibly.
  const heightCm =
    s.bmi > 0 ? Math.round(Math.sqrt(s.weightKg / s.bmi) * 100) : null;

  const onESA = s.onESA || s.medCodes.some((c) => ESA_RXNORM.has(c));

  return {
    id: "scenario",
    name: s.name,
    birthDate: "",
    age: s.age,
    gender: s.gender,
    race: null,
    ethnicity: null,
    weightKg: s.weightKg,
    heightCm,
    bmi: s.bmi,
    activeCancerConditions: conditions,
    labs: {
      platelets: lab(s.platelets, LOINC.PLATELETS, "10³/µL"),
      hemoglobin: lab(s.hemoglobin, LOINC.HEMOGLOBIN, "g/dL"),
      wbc: lab(s.wbc, LOINC.WBC, "10³/µL"),
      serumCreatinine: lab(s.serumCreatinine, LOINC.SERUM_CREATININE, "mg/dL"),
      alt: lab(s.alt, LOINC.ALT, "U/L"),
      ast: lab(s.ast, LOINC.AST, "U/L"),
      totalBilirubin: lab(s.totalBilirubin, LOINC.TOTAL_BILIRUBIN, "mg/dL"),
    },
    activeMedications: meds,
    onESA,
    onAntiplatelet: s.medCodes.some((c) => ANTIPLATELET_RXNORM.has(c)),
    onIMiD: s.medCodes.some((c) => IMID_RXNORM.has(c)),
    hasNephrotoxicChemo: s.medCodes.some((c) => NEPHROTOXIC_CHEMO_RXNORM.has(c)),
  };
}

/** Seed an editable Scenario from a parsed preset patient. */
export function patientToScenario(p: PatientData): Scenario {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    weightKg: p.weightKg ?? 75,
    bmi: p.bmi ?? 25,
    conditionCode: p.activeCancerConditions[0]?.code ?? "C25.1",
    platelets: p.labs.platelets?.value ?? null,
    hemoglobin: p.labs.hemoglobin?.value ?? null,
    wbc: p.labs.wbc?.value ?? null,
    serumCreatinine: p.labs.serumCreatinine?.value ?? null,
    totalBilirubin: p.labs.totalBilirubin?.value ?? null,
    alt: p.labs.alt?.value ?? null,
    ast: p.labs.ast?.value ?? null,
    onESA: p.onESA,
    medCodes: p.activeMedications.map((m) => m.rxnormCode),
  };
}
