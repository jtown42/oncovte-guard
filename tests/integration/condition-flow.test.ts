/**
 * End-to-end condition-flow tests.
 *
 * Guards a defect neither the unit tests nor the earlier reviews caught: the FHIR
 * parser must pass NON-cancer conditions (antiphospholipid syndrome D68.61, HIT
 * D75.82, pregnancy/breastfeeding via O-chapter, Z33.1, Z39.1) to the contraindication
 * engine. Previously parseConditions filtered to cancer codes only, so these
 * contraindications never fired from real FHIR data — they only worked in direct
 * unit tests. These tests exercise the full assemblePatientData ->
 * generateRecommendation path with a real Condition bundle.
 */

import { describe, it, expect } from "vitest";
import type { Bundle, Patient } from "fhir/r4";
import { assemblePatientData, type RawFHIRData } from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { LOINC } from "../../src/data/loinc-codes";

const ICD10 = "http://hl7.org/fhir/sid/icd-10-cm";
const LOINC_SYSTEM = "http://loinc.org";
const NOW = new Date("2026-06-01T00:00:00Z");
const RECENT = "2026-05-28"; // within 30 days of NOW -> not stale

function conditionBundle(codes: string[]): Bundle {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: codes.map((code) => ({
      resource: {
        resourceType: "Condition",
        clinicalStatus: { coding: [{ code: "active" }] },
        code: { coding: [{ system: ICD10, code, display: code }] },
        subject: { reference: "Patient/p" },
      },
    })),
  };
}

function obs(loinc: string, value: number): object {
  return {
    resource: {
      resourceType: "Observation",
      status: "final",
      effectiveDateTime: RECENT,
      code: { coding: [{ system: LOINC_SYSTEM, code: loinc }] },
      valueQuantity: { value },
      subject: { reference: "Patient/p" },
    },
  };
}

function bundleOf(entries: object[]): Bundle {
  return { resourceType: "Bundle", type: "collection", entry: entries as never };
}

/** Pancreatic (+2 -> Khorana >=2) with normal labs and good renal function. */
function rawWith(conditionCodes: string[]): RawFHIRData {
  const patient: Patient = {
    resourceType: "Patient",
    id: "p",
    gender: "female",
    birthDate: "1958-01-01",
  };
  const labs = bundleOf([
    obs(LOINC.PLATELETS, 200),
    obs(LOINC.HEMOGLOBIN, 13),
    obs(LOINC.WBC, 8),
    obs(LOINC.SERUM_CREATININE, 0.8),
  ]);
  const vitals = bundleOf([obs(LOINC.BODY_WEIGHT, 80), obs(LOINC.BODY_HEIGHT, 165)]);
  return {
    patient,
    conditions: conditionBundle(["C25.1", ...conditionCodes]),
    labs,
    vitals,
    medications: bundleOf([]),
  };
}

const rec = (codes: string[]) =>
  generateRecommendation(assemblePatientData(rawWith(codes), NOW));

describe("condition flow: non-cancer contraindications reach the engine via the parser", () => {
  it("control — pancreatic alone recommends the DOACs", () => {
    const r = rec([]);
    expect(r.overallAction).toBe("recommend");
    expect(r.preferredOptions.map((o) => o.name).sort()).toEqual([
      "apixaban",
      "rivaroxaban",
    ]);
  });

  it("APS (D68.61) blocks the DOACs but NOT anticoagulation — LMWH is recommended", () => {
    const r = rec(["D68.61"]);
    expect(r.overallAction).not.toBe("contraindicated"); // targeted, not a universal abort
    expect(r.preferredOptions.length).toBe(0); // both DOACs blocked
    expect(r.verdictLabel).toBe("recommend_lmwh");
    expect(r.alternativeOptions.map((o) => o.name).sort()).toEqual([
      "dalteparin",
      "enoxaparin",
    ]);
    const apixaban = r.avoidOptions.find((o) => o.name === "apixaban");
    expect(apixaban?.ineligibleReason ?? "").toMatch(/antiphospholipid/i);
  });

  it("pregnancy (Z33.1) and breastfeeding (Z39.1) block the DOACs -> LMWH", () => {
    for (const code of ["Z33.1", "O09.90", "Z39.1"]) {
      const r = rec([code]);
      expect(r.overallAction, `${code}`).not.toBe("contraindicated");
      expect(r.preferredOptions.length, `${code}`).toBe(0);
      expect(r.verdictLabel, `${code}`).toBe("recommend_lmwh");
    }
  });

  it("HIT (D75.82) is the mirror image — DOACs preferred, LMWH blocked", () => {
    const r = rec(["D75.82"]);
    expect(r.preferredOptions.map((o) => o.name).sort()).toEqual([
      "apixaban",
      "rivaroxaban",
    ]);
    const enox = r.avoidOptions.find((o) => o.name === "enoxaparin");
    expect(enox?.ineligibleReason ?? "").toMatch(/heparin|HIT/i);
  });
});
