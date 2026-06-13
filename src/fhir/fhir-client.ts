/**
 * Live FHIR data fetch (Part 17).
 * Pulls the Patient plus the Conditions, labs, vitals, and active medications
 * the clinical engines need, returning the grouped RawFHIRData shape consumed
 * by assemblePatientData().
 */

import type Client from "fhirclient/lib/Client";
import type { Bundle, Patient } from "fhir/r4";
import type { RawFHIRData } from "./fhir-parser";
import { LAB_LOINC_CODES, VITAL_LOINC_CODES } from "../data/loinc-codes";

export async function fetchPatientData(client: Client): Promise<RawFHIRData> {
  const patient = (await client.patient.read()) as Patient;
  const pid = patient.id;

  const labCodes = LAB_LOINC_CODES.join(",");
  const vitalCodes = VITAL_LOINC_CODES.join(",");

  const [conditions, labs, vitals, medications] = await Promise.all([
    client.request<Bundle>(
      `Condition?patient=${pid}&clinical-status=active&category=encounter-diagnosis`,
    ),
    client.request<Bundle>(
      `Observation?patient=${pid}&category=laboratory&code=${labCodes}&_sort=-date&_count=50`,
    ),
    client.request<Bundle>(
      `Observation?patient=${pid}&category=vital-signs&code=${vitalCodes}&_sort=-date&_count=10`,
    ),
    client.request<Bundle>(
      `MedicationRequest?patient=${pid}&status=active`,
    ),
  ]);

  return { patient, conditions, labs, vitals, medications };
}
