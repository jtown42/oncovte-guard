/**
 * Normalized patient data — the single shape produced by the FHIR parser
 * (Session 2) and consumed by every clinical engine.
 * Source: plan/ddi-info.md Part 11 (types/patient.ts).
 */

import type { CancerCategory } from "./khorana";

export interface LabValue {
  value: number;
  unit: string;
  date: string; // ISO date
  loincCode: string;
  isStale: boolean; // >30 days old
}

export interface MedicationItem {
  rxnormCode: string;
  display: string;
  status: string;
}

export interface CancerConditionItem {
  code: string; // ICD-10-CM
  display: string;
  category: CancerCategory;
}

export interface PatientLabs {
  platelets: LabValue | null;
  hemoglobin: LabValue | null;
  wbc: LabValue | null;
  serumCreatinine: LabValue | null;
  alt: LabValue | null;
  ast: LabValue | null;
  totalBilirubin: LabValue | null;
}

export interface PatientData {
  // Demographics
  id: string;
  name: string;
  birthDate: string;
  age: number;
  gender: "male" | "female";
  race: string | null;
  ethnicity: string | null;

  // Vitals
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;

  // Cancer
  activeCancerConditions: CancerConditionItem[];

  // Labs (most recent per analyte)
  labs: PatientLabs;

  // Medications
  activeMedications: MedicationItem[];

  // Derived flags
  onESA: boolean;
  onAntiplatelet: boolean;
  onIMiD: boolean;
  hasNephrotoxicChemo: boolean;

  /**
   * Active major bleeding — a universal absolute contraindication to
   * anticoagulation. FHIR has no single, reliable representation of active
   * bleeding status, so this is a clinician-assessed boolean (default false
   * from FHIR data; set via the standalone what-if editor or, in a live
   * deployment, a clinician confirmation step).
   */
  hasActiveMajorBleeding: boolean;
}
