/**
 * Regression tests for the OpenEvidence full rules review (2026-10-31;
 * docs/OPENEVIDENCE-RULES-REVIEW.md). Tier 1 fixes, one block per change.
 */

import { describe, it, expect } from "vitest";
import type { Bundle, Patient } from "fhir/r4";
import { loadSyntheticPatient } from "../../src/fhir/standalone-loader";
import {
  assemblePatientData,
  parseHemoglobinDrop,
  type RawFHIRData,
} from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { checkDDIs, prophylaxisSeverity } from "../../src/core/ddi-checker";
import { assessBleedingRisk } from "../../src/core/bleeding-risk";
import { LOINC } from "../../src/data/loinc-codes";
import { verdictText } from "../../src/fhir-output/build";
import type { PatientData } from "../../src/types/patient";

const NOW = new Date("2026-06-10T12:00:00Z");
const maria = () => assemblePatientData(loadSyntheticPatient(0), NOW);
const james = () => assemblePatientData(loadSyntheticPatient(1), NOW);
const dorothy = () => assemblePatientData(loadSyntheticPatient(2), NOW);

/** Maria with her hemoglobin set directly (already in g/dL). */
function mariaHgb(value: number): PatientData {
  const m = maria();
  return { ...m, labs: { ...m.labs, hemoglobin: { ...m.labs.hemoglobin!, value } } };
}

/* ---------- a tiny FHIR builder for parser-level tests ---------- */

const ICD10 = "http://hl7.org/fhir/sid/icd-10-cm";
const LOINC_SYSTEM = "http://loinc.org";
const RECENT = "2026-06-05";

function obs(loinc: string, value: number, unit?: string, date = RECENT): object {
  return {
    resource: {
      resourceType: "Observation",
      status: "final",
      effectiveDateTime: date,
      code: { coding: [{ system: LOINC_SYSTEM, code: loinc }] },
      valueQuantity: { value, ...(unit ? { unit, code: unit } : {}) },
    },
  };
}
const bundle = (entry: object[]): Bundle => ({ resourceType: "Bundle", type: "collection", entry: entry as never });

/** Pancreatic patient (Khorana +2) with the given hemoglobin/creatinine observations. */
function raw(hgb: object[], creat: object = obs(LOINC.SERUM_CREATININE, 0.8, "mg/dL")): RawFHIRData {
  const patient: Patient = { resourceType: "Patient", id: "p", gender: "female", birthDate: "1960-01-01" };
  return {
    patient,
    conditions: bundle([
      { resource: { resourceType: "Condition", code: { coding: [{ system: ICD10, code: "C25.1" }] } } },
    ]),
    labs: bundle([obs(LOINC.PLATELETS, 200), obs(LOINC.WBC, 8), creat, ...hgb]),
    vitals: bundle([obs(LOINC.BODY_WEIGHT, 70), obs(LOINC.BODY_HEIGHT, 165)]),
    medications: bundle([]),
  };
}

describe("Severe-anemia hold (Hgb <7 g/dL; OncoVTE design rule)", () => {
  it("6.9 g/dL → hold, labeled a design rule, while Khorana still counts the anemia point", () => {
    const r = generateRecommendation(mariaHgb(6.9));
    expect(r.overallAction).toBe("contraindicated");
    expect(r.verdictLabel).toBe("hold_severe_anemia");
    expect(r.preferredOptions).toHaveLength(0);
    expect(r.khorana.breakdown.hemoglobin.score).toBe(1);
    const a = r.alerts.find((x) => x.level === "critical")!;
    expect(a.detail).toMatch(/not an NCCN contraindication/);
    expect(verdictText(r)).toBe("Hold — evaluate severe anemia first");
  });

  it("7.0 g/dL → no hold; Khorana +1 and the usual recommendation", () => {
    const r = generateRecommendation(mariaHgb(7.0));
    expect(r.verdictLabel).not.toBe("hold_severe_anemia");
    expect(r.preferredOptions.map((o) => o.name)).toEqual(["apixaban", "rivaroxaban"]);
    expect(r.khorana.breakdown.hemoglobin.score).toBe(1);
  });

  it("platelets <50 alongside Hgb <7 reads as a full contraindication, not just a hold", () => {
    const m = mariaHgb(6.5);
    const p = { ...m, labs: { ...m.labs, platelets: { ...m.labs.platelets!, value: 40 } } };
    expect(generateRecommendation(p).verdictLabel).toBe("contraindicated");
  });
});

describe("Hemoglobin and creatinine units (UCUM)", () => {
  it("50 g/L → 5.0 g/dL → hold", () => {
    const p = assemblePatientData(raw([obs(LOINC.HEMOGLOBIN, 50, "g/L")]), NOW);
    expect(p.labs.hemoglobin?.value).toBe(5);
    expect(generateRecommendation(p).verdictLabel).toBe("hold_severe_anemia");
  });

  it("5 mmol/L → about 8.1 g/dL → no hold, Khorana +1", () => {
    const p = assemblePatientData(raw([obs(LOINC.HEMOGLOBIN, 5, "mmol/L")]), NOW);
    expect(p.labs.hemoglobin?.value).toBeCloseTo(8.06, 1);
    const r = generateRecommendation(p);
    expect(r.verdictLabel).not.toBe("hold_severe_anemia");
    expect(r.khorana.breakdown.hemoglobin.score).toBe(1);
  });

  it("an unknown unit → value not used, 'verify manually', no Khorana point", () => {
    const p = assemblePatientData(raw([obs(LOINC.HEMOGLOBIN, 9, "mg/mL")]), NOW);
    expect(p.labs.hemoglobin).toBeNull();
    expect(p.unitIssues?.[0]).toMatch(/Hemoglobin reported as 9 mg\/mL/);
    const r = generateRecommendation(p);
    expect(r.khorana.breakdown.hemoglobin.score).toBe(0);
    expect(r.alerts.some((a) => /verify manually/.test(a.title))).toBe(true);
  });

  it("creatinine in µmol/L is converted (70 µmol/L ≈ 0.79 mg/dL)", () => {
    const p = assemblePatientData(
      raw([obs(LOINC.HEMOGLOBIN, 12, "g/dL")], obs(LOINC.SERUM_CREATININE, 70, "umol/L")),
      NOW,
    );
    expect(p.labs.serumCreatinine?.value).toBeCloseTo(0.79, 2);
    expect(generateRecommendation(p).renal!.crclMlMin).toBeGreaterThan(60);
  });
});

describe("Hemoglobin drop ≥2 g/dL within 30 days", () => {
  it("11.8 → 9.5 within 30 days → 'possible active bleeding' warning", () => {
    const labs = bundle([obs(LOINC.HEMOGLOBIN, 11.8, "g/dL", "2026-05-20"), obs(LOINC.HEMOGLOBIN, 9.5, "g/dL", "2026-06-05")]);
    expect(parseHemoglobinDrop(labs)).toEqual({ from: 11.8, to: 9.5, days: 16 });
    const p = assemblePatientData(
      raw([obs(LOINC.HEMOGLOBIN, 11.8, "g/dL", "2026-05-20"), obs(LOINC.HEMOGLOBIN, 9.5, "g/dL", "2026-06-05")]),
      NOW,
    );
    expect(generateRecommendation(p).alerts.some((a) => /possible active bleeding/.test(a.title))).toBe(true);
  });

  it("the same fall over more than 30 days, or a fall under 2 g/dL, does not warn", () => {
    expect(parseHemoglobinDrop(bundle([obs(LOINC.HEMOGLOBIN, 11.8, "g/dL", "2026-04-01"), obs(LOINC.HEMOGLOBIN, 9.5, "g/dL", "2026-06-05")]))).toBeNull();
    expect(parseHemoglobinDrop(bundle([obs(LOINC.HEMOGLOBIN, 11.0, "g/dL", "2026-05-20"), obs(LOINC.HEMOGLOBIN, 9.5, "g/dL", "2026-06-05")]))).toBeNull();
  });
});

describe("Already anticoagulated", () => {
  it("an active apixaban order → 'Already anticoagulated', no agent offered", () => {
    const m = maria();
    const r = generateRecommendation({
      ...m,
      activeMedications: [...m.activeMedications, { rxnormCode: "1364430", display: "Apixaban 5 mg", status: "active" }],
    });
    expect(r.overallAction).toBe("not_indicated");
    expect(r.verdictLabel).toBe("already_anticoagulated");
    expect(r.preferredOptions).toHaveLength(0);
    expect(r.alternativeOptions).toHaveLength(0);
  });

  it("warfarin and enoxaparin count too", () => {
    for (const code of ["11289", "67108"]) {
      const m = maria();
      const r = generateRecommendation({ ...m, activeMedications: [{ rxnormCode: code, display: code, status: "active" }] });
      expect(r.verdictLabel, code).toBe("already_anticoagulated");
    }
  });
});

describe("Decision order: universal stops come before the Khorana exclusion", () => {
  it("myeloma with platelets 40 → contraindicated, not a pointer to a myeloma regimen", () => {
    const m = maria();
    const p: PatientData = {
      ...m,
      activeCancerConditions: [{ code: "C90.00", display: "Multiple myeloma", category: m.activeCancerConditions[0].category }],
      activeConditions: [{ code: "C90.00" }],
      labs: { ...m.labs, platelets: { ...m.labs.platelets!, value: 40 } },
    };
    expect(generateRecommendation(p).overallAction).toBe("contraindicated");
  });
});

describe("Insufficient data instead of 'not indicated'", () => {
  function lung(over: Partial<PatientData>): PatientData {
    const d = dorothy();
    return {
      ...d,
      ...over,
      labs: {
        ...d.labs,
        platelets: { ...d.labs.platelets!, value: 250 },
        hemoglobin: { ...d.labs.hemoglobin!, value: 13 },
        wbc: { ...d.labs.wbc!, value: 7 },
        ...(over.labs ?? {}),
      },
    };
  }

  it("lung (1 point) with BMI missing → insufficient data, not 'not indicated'", () => {
    const r = generateRecommendation(lung({ bmi: null }));
    expect(r.khorana.totalScore).toBe(1);
    expect(r.verdictLabel).toBe("insufficient_data");
    expect(verdictText(r)).toBe("Insufficient data");
  });

  it("lung (1 point) with everything present → not indicated", () => {
    expect(generateRecommendation(lung({ bmi: 24 })).verdictLabel).toBe("not_indicated");
  });
});

describe("On-screen contradictions removed", () => {
  it("CrCl <30 no longer says 'LMWH preferred' (NCCN avoids LMWH below 30)", () => {
    const f = assessBleedingRisk({
      conditions: [], crclMlMin: 18, weightKg: 70, hemoglobin: 12, plateletCount: 200, onAntiplatelet: false,
    }).factors.find((x) => x.key === "severe_renal_impairment")!;
    expect(f.prefersLmwh).toBe(false);
    expect(f.detail).not.toMatch(/LMWH preferred/);
  });

  it("the gastric note cites NCCN for the risk and ACC for 'LMWH may be preferred'", () => {
    const f = assessBleedingRisk({
      conditions: [{ code: "C16.9" }], crclMlMin: 80, weightKg: 70, hemoglobin: 12, plateletCount: 200, onAntiplatelet: false,
    }).factors.find((x) => x.key === "gastric_gej_tumor")!;
    expect(f.detail).toMatch(/NCCN VTE-2 footnote\).*ACC 2026/);
  });
});

describe("Supportive-care drugs are rated, not 'unknown'", () => {
  it("acyclovir, allopurinol and ondansetron → none for apixaban and rivaroxaban", () => {
    for (const code of ["281", "519", "26225"]) {
      const d = checkDDIs({ rxnormCode: code, display: code });
      expect(d.perDoac.apixaban.severity, code).toBe("none");
      expect(d.perDoac.rivaroxaban.severity, code).toBe("none");
      expect(prophylaxisSeverity(d), code).toBe("none");
    }
  });

  it("James's screen shows no 'unknown' interaction, and his verdict is unchanged", () => {
    const r = generateRecommendation(james());
    expect(r.ddiResults.filter((d) => prophylaxisSeverity(d) === "unknown")).toHaveLength(0);
    expect(r.verdictLabel).toBe("recommend_lmwh");
  });
});

describe("Demo patients keep their verdicts", () => {
  it("Maria, James, Dorothy (42k) unchanged", () => {
    expect(generateRecommendation(maria()).overallAction).toBe("recommend");
    expect(generateRecommendation(james()).verdictLabel).toBe("recommend_lmwh");
    expect(generateRecommendation(dorothy()).overallAction).toBe("contraindicated");
    expect(generateRecommendation(dorothy()).verdictLabel).toBe("contraindicated");
  });
});
