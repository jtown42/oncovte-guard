/**
 * CDS Hooks service discovery document.
 *
 * Two services:
 *   - oncovte-prophylaxis (patient-view): on chart open, surface the VTE
 *     prophylaxis assessment (Khorana, contraindications, options).
 *   - oncovte-ddi-check (order-select): when an anticoagulant or chemotherapy
 *     order is being composed, flag DOAC interactions in real time.
 *
 * Both declare prefetch templates so a conformant EHR delivers the needed FHIR
 * resources inline; the handler also falls back to the live fhirServer if a
 * prefetch key is absent.
 */
import type { CdsService, CdsDiscovery } from "./types";

const PREFETCH = {
  patient: "Patient/{{context.patientId}}",
  conditions:
    "Condition?patient={{context.patientId}}&clinical-status=active",
  labs: "Observation?patient={{context.patientId}}&category=laboratory&_count=100",
  vitals:
    "Observation?patient={{context.patientId}}&category=vital-signs&_count=20",
  medications:
    "MedicationRequest?patient={{context.patientId}}&status=active",
} as const;

export const PROPHYLAXIS_SERVICE: CdsService = {
  hook: "patient-view",
  id: "oncovte-prophylaxis",
  title: "OncoVTE Guard — VTE prophylaxis assessment",
  description:
    "Computes the Khorana VTE risk score for ambulatory cancer patients and recommends NCCN-concordant pharmacologic prophylaxis, screening for DOAC–chemotherapy interactions, renal dosing, and contraindications.",
  prefetch: PREFETCH,
};

export const DDI_CHECK_SERVICE: CdsService = {
  hook: "order-select",
  id: "oncovte-ddi-check",
  title: "OncoVTE Guard — DOAC interaction check",
  description:
    "When an anticoagulant or antineoplastic order is selected, flags clinically significant DOAC–chemotherapy interactions and suggests safer alternatives.",
  prefetch: PREFETCH,
};

export const DISCOVERY: CdsDiscovery = {
  services: [PROPHYLAXIS_SERVICE, DDI_CHECK_SERVICE],
};
