/**
 * End-to-end integration tests: synthetic FHIR bundle -> parser -> PatientData
 * -> generateRecommendation, asserting the expected clinical outputs from
 * plan/ddi-info.md Part 7 (with ERRATA corrections, e.g. Maria's nab-paclitaxel
 * RxNorm 686924 and the LMWH-not-dabi/edox fallback).
 *
 * A fixed reference date makes age and lab-staleness deterministic.
 */

import { describe, it, expect } from "vitest";
import {
  loadSyntheticPatient,
  listSyntheticPatients,
} from "../../src/fhir/standalone-loader";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { CancerCategory } from "../../src/types/khorana";
import type { DDICheckResult } from "../../src/types/ddi";

const NOW = new Date("2026-06-10T12:00:00Z");

function load(index: number) {
  return assemblePatientData(loadSyntheticPatient(index), NOW);
}

function ddiFor(results: DDICheckResult[], rxnorm: string) {
  return results.find((r) => r.rxnormCode === rxnorm);
}

describe("synthetic patient roster", () => {
  it("lists all five patients with names", () => {
    const list = listSyntheticPatients();
    expect(list).toHaveLength(5);
    expect(list[0].name).toBe("Maria Santos");
    expect(list[4].name).toBe("Priya Patel");
  });
});

describe("Patient 1: Maria Santos — High Khorana, clean meds, normal renal", () => {
  const p = load(0);
  const r = generateRecommendation(p);

  it("parses demographics, vitals, and BMI", () => {
    expect(p.name).toBe("Maria Santos");
    expect(p.age).toBe(58);
    expect(p.gender).toBe("female");
    expect(p.weightKg).toBe(95);
    expect(p.bmi).toBeCloseTo(36.2, 1);
    expect(p.ethnicity).toBe("Hispanic or Latino");
  });

  it("classifies pancreatic cancer as very-high and scores Khorana 5 (High)", () => {
    expect(p.activeCancerConditions[0].category).toBe(CancerCategory.VERY_HIGH);
    expect(r.khorana.totalScore).toBe(5);
    expect(r.khorana.riskCategory).toBe("high");
  });

  it("recommends apixaban + rivaroxaban with normal renal function", () => {
    expect(r.overallAction).toBe("recommend");
    expect(r.preferredOptions.map((o) => o.name).sort()).toEqual([
      "apixaban",
      "rivaroxaban",
    ]);
    expect(r.renal?.crclMlMin).toBeCloseTo(115, 0);
    expect(r.renal?.crclCategory).toBe("normal");
  });

  it("uses ERRATA-corrected nab-paclitaxel 686924 -> MINOR, not blocking", () => {
    const nab = ddiFor(r.ddiResults, "686924");
    expect(nab).toBeDefined();
    expect(nab?.perDoac.apixaban.severity).toBe("minor");
    expect(nab?.worstSeverity).toBe("minor");
    expect(r.staleLabWarning).toBe(false);
  });
});

describe("Patient 2: James Chen — Intermediate Khorana, MAJOR ibrutinib DDI", () => {
  const p = load(1);
  const r = generateRecommendation(p);

  it("scores Khorana 2 (Intermediate, meets >=2 threshold)", () => {
    expect(p.age).toBe(72);
    expect(r.khorana.totalScore).toBe(2);
    expect(r.khorana.riskCategory).toBe("intermediate");
    expect(r.khorana.prophylaxisRecommended).toBe(true);
  });

  it("flags ibrutinib as MAJOR for both DOACs", () => {
    const ibr = ddiFor(r.ddiResults, "1442981");
    expect(ibr?.perDoac.apixaban.severity).toBe("major");
    expect(ibr?.perDoac.rivaroxaban.severity).toBe("major");
    expect(r.alerts.some((a) => a.level === "critical")).toBe(true);
  });

  it("ERRATA Issue 4: both DOACs blocked -> LMWH; never dabi/edox", () => {
    expect(r.preferredOptions).toHaveLength(0);
    expect(r.alternativeOptions.map((o) => o.name).sort()).toEqual([
      "dalteparin",
      "enoxaparin",
    ]);
    const offered = [...r.preferredOptions, ...r.alternativeOptions].map(
      (o) => o.name,
    );
    expect(offered).not.toContain("dabigatran");
    expect(offered).not.toContain("edoxaban");
  });

  it("rituximab has no interaction", () => {
    const ritux = ddiFor(r.ddiResults, "121191");
    expect(ritux?.worstSeverity).toBe("none");
  });
});

describe("Patient 3: Dorothy Williams — High Khorana, severe renal + thrombocytopenia", () => {
  const p = load(2);
  const r = generateRecommendation(p);

  it("scores Khorana 3 (High)", () => {
    expect(p.age).toBe(81);
    expect(r.khorana.totalScore).toBe(3);
    expect(r.khorana.riskCategory).toBe("high");
  });

  it("platelets 42K is a universal absolute contraindication", () => {
    expect(r.overallAction).toBe("contraindicated");
    expect(
      r.contraindications.absolute.some(
        (c) => c.reason === "severe_thrombocytopenia" && c.appliesTo === "all",
      ),
    ).toBe(true);
    expect(r.preferredOptions).toHaveLength(0);
  });

  it("computes severe CrCl (~12.9) and flags nephrotoxic carboplatin", () => {
    expect(r.renal?.crclMlMin).toBeCloseTo(12.9, 1);
    expect(r.renal?.crclCategory).toBe("severe");
    expect(p.hasNephrotoxicChemo).toBe(true);
    expect(r.renal?.warnings).toContain("nephrotoxic_chemotherapy");
  });
});

describe("Patient 4: Robert Johnson — Low Khorana, stale labs, pharmacodynamic DDI", () => {
  const p = load(3);
  const r = generateRecommendation(p);

  it("scores Khorana 0 (Low) -> not indicated", () => {
    expect(p.age).toBe(65);
    expect(p.activeCancerConditions[0].category).toBe(CancerCategory.STANDARD);
    expect(r.khorana.totalScore).toBe(0);
    expect(r.overallAction).toBe("not_indicated");
  });

  it("flags labs >30 days old as stale", () => {
    expect(r.staleLabWarning).toBe(true);
    expect(r.staleLabFields).toContain("platelets");
    expect(p.labs.platelets?.isStale).toBe(true);
  });

  it("notes bevacizumab pharmacodynamic bleeding risk", () => {
    const bev = ddiFor(r.ddiResults, "253337");
    expect(bev?.worstSeverity).toBe("pharmacodynamic");
  });
});

describe("Patient 5: Priya Patel — Multiple myeloma exclusion + IMiD", () => {
  const p = load(4);
  const r = generateRecommendation(p);

  it("is excluded from Khorana scoring (myeloma)", () => {
    expect(p.age).toBe(55);
    expect(p.activeCancerConditions[0].category).toBe(CancerCategory.EXCLUDED);
    expect(r.overallAction).toBe("excluded");
    expect(r.khorana.exclusion.isExcluded).toBe(true);
    expect(r.khorana.exclusion.reason).toBe("multiple_myeloma");
  });

  it("detects IMiD therapy (lenalidomide)", () => {
    expect(p.onIMiD).toBe(true);
  });

  it("still surfaces dexamethasone as a MODERATE DDI for awareness", () => {
    const dex = ddiFor(r.ddiResults, "3264");
    expect(dex?.worstSeverity).toBe("moderate");
  });

  it("points the clinician to myeloma-specific prophylaxis (IMiD pathway)", () => {
    expect(
      r.alerts.some((a) => /myeloma-specific VTE prophylaxis/i.test(a.title)),
    ).toBe(true);
  });
});
