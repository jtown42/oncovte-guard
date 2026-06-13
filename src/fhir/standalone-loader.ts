/**
 * Standalone synthetic-patient loader (Part 17A).
 * Splits a flat FHIR R4 "collection" Bundle into the grouped RawFHIRData shape
 * the parser expects, so demo/standalone mode runs through the exact same
 * parsing path as a live SMART launch.
 */

import type { Bundle, BundleEntry, Patient, Observation } from "fhir/r4";
import type { RawFHIRData } from "./fhir-parser";

import patient1 from "../../synthetic-patients/patient-1-maria-santos.json";
import patient2 from "../../synthetic-patients/patient-2-james-chen.json";
import patient3 from "../../synthetic-patients/patient-3-dorothy-williams.json";
import patient4 from "../../synthetic-patients/patient-4-robert-johnson.json";
import patient5 from "../../synthetic-patients/patient-5-priya-patel.json";

const SYNTHETIC_BUNDLES = [
  patient1,
  patient2,
  patient3,
  patient4,
  patient5,
] as unknown as Bundle[];

export interface SyntheticPatientSummary {
  index: number;
  id: string;
  name: string;
}

/** Lightweight list for a standalone-mode patient picker. */
export function listSyntheticPatients(): SyntheticPatientSummary[] {
  return SYNTHETIC_BUNDLES.map((bundle, index) => {
    const patient = firstResource<Patient>(bundle, "Patient");
    const n = patient?.name?.[0];
    const name = n
      ? `${(n.given ?? []).join(" ")} ${n.family ?? ""}`.trim()
      : `Patient ${index + 1}`;
    return { index, id: patient?.id ?? `patient-${index + 1}`, name };
  });
}

function entries(bundle: Bundle): BundleEntry[] {
  return bundle.entry ?? [];
}

function firstResource<T>(bundle: Bundle, type: string): T | undefined {
  return entries(bundle)
    .map((e) => e.resource)
    .find((r) => r?.resourceType === type) as T | undefined;
}

function observationCategory(o: Observation): string | undefined {
  return o.category?.[0]?.coding?.[0]?.code;
}

/** Wrap a list of resources back into a minimal searchset Bundle. */
function asBundle(resourceList: BundleEntry["resource"][]): Bundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    entry: resourceList.map((resource) => ({ resource })),
  };
}

/**
 * Partition a flat collection Bundle into grouped RawFHIRData (Patient +
 * Condition/lab/vital/medication sub-bundles).
 */
export function bundleToRawFHIRData(bundle: Bundle): RawFHIRData {
  const all = entries(bundle)
    .map((e) => e.resource)
    .filter((r): r is NonNullable<typeof r> => !!r);

  const patient = all.find((r) => r.resourceType === "Patient") as
    | Patient
    | undefined;
  if (!patient) {
    throw new Error("Bundle contains no Patient resource.");
  }

  const conditions = all.filter((r) => r.resourceType === "Condition");
  const observations = all.filter(
    (r): r is Observation => r.resourceType === "Observation",
  );
  const labs = observations.filter(
    (o) => observationCategory(o) === "laboratory",
  );
  const vitals = observations.filter(
    (o) => observationCategory(o) === "vital-signs",
  );
  const medications = all.filter(
    (r) => r.resourceType === "MedicationRequest",
  );

  return {
    patient,
    conditions: asBundle(conditions),
    labs: asBundle(labs),
    vitals: asBundle(vitals),
    medications: asBundle(medications),
  };
}

/** Load one synthetic patient (by index) as grouped RawFHIRData. */
export function loadSyntheticPatient(index: number): RawFHIRData {
  const bundle = SYNTHETIC_BUNDLES[index];
  if (!bundle) {
    throw new Error(`No synthetic patient at index ${index}.`);
  }
  return bundleToRawFHIRData(bundle);
}
