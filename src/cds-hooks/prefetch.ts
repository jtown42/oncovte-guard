/**
 * Adapt a CDS Hooks request's resolved `prefetch` block into the RawFHIRData
 * shape the FHIR parser consumes — so the CDS service runs the identical
 * clinical pipeline as the SMART app and the standalone demo.
 */
import type { Bundle, Patient } from "fhir/r4";
import type { RawFHIRData } from "../fhir/fhir-parser";

const EMPTY_BUNDLE: Bundle = {
  resourceType: "Bundle",
  type: "searchset",
  entry: [],
};

/**
 * Coerce a prefetch value to a Bundle. The search-based prefetch templates
 * (conditions/labs/vitals/medications) always resolve to a searchset Bundle; a
 * missing or malformed value degrades gracefully to an empty Bundle so the
 * parser still produces a well-formed (sparse) PatientData.
 */
function asBundle(value: unknown): Bundle {
  if (value && typeof value === "object") {
    const v = value as { resourceType?: string };
    if (v.resourceType === "Bundle") return value as Bundle;
  }
  return { ...EMPTY_BUNDLE };
}

export function prefetchToRawFHIRData(
  prefetch: Record<string, unknown> | undefined,
): RawFHIRData {
  const pf = prefetch ?? {};
  const patient = pf.patient as Patient | undefined;
  if (!patient || patient.resourceType !== "Patient") {
    throw new Error(
      "CDS Hooks request is missing a Patient resource in prefetch.",
    );
  }
  return {
    patient,
    conditions: asBundle(pf.conditions),
    labs: asBundle(pf.labs),
    vitals: asBundle(pf.vitals),
    medications: asBundle(pf.medications),
  };
}
