/**
 * Scenario wiring tests. These prove the interactive editor feeds the REAL
 * engine: a Scenario -> scenarioToPatient -> generateRecommendation round-trip
 * produces guideline-correct output, and the parser-derived flags are
 * reconstructed from the medication RxNorm codes (not faked).
 */
import { describe, it, expect } from "vitest";
import {
  type Scenario,
  scenarioToPatient,
  patientToScenario,
  CANCER_OPTIONS,
  MED_CATALOG,
} from "../../src/standalone/scenario";
import { generateRecommendation } from "../../src/core/recommendation";

const BASE: Scenario = {
  name: "Test",
  age: 60,
  gender: "female",
  weightKg: 80,
  bmi: 27,
  conditionCode: "C25.1", // pancreas, very high (2 pts)
  platelets: 200,
  hemoglobin: 13,
  wbc: 8,
  serumCreatinine: 0.9,
  totalBilirubin: 0.6,
  alt: 20,
  ast: 20,
  onESA: false,
  hasActiveMajorBleeding: false,
  medCodes: [],
};

describe("scenarioToPatient flag derivation", () => {
  it("derives onAntiplatelet from aspirin (RxNorm 1191)", () => {
    const p = scenarioToPatient({ ...BASE, medCodes: ["1191"] });
    expect(p.onAntiplatelet).toBe(true);
    expect(p.onIMiD).toBe(false);
  });

  it("derives onIMiD from lenalidomide (RxNorm 321191)", () => {
    const p = scenarioToPatient({ ...BASE, medCodes: ["321191"] });
    expect(p.onIMiD).toBe(true);
  });

  it("derives hasNephrotoxicChemo from carboplatin (RxNorm 40048)", () => {
    const p = scenarioToPatient({ ...BASE, medCodes: ["40048"] });
    expect(p.hasNephrotoxicChemo).toBe(true);
  });

  it("ESA toggle scores even without a medication", () => {
    const p = scenarioToPatient({ ...BASE, onESA: true });
    expect(p.onESA).toBe(true);
  });

  it("reconstructs a coherent height from weight + BMI", () => {
    const p = scenarioToPatient({ ...BASE, weightKg: 80, bmi: 27 });
    // sqrt(80/27) m ~= 1.72 m -> ~172 cm
    expect(p.heightCm).toBeGreaterThan(165);
    expect(p.heightCm).toBeLessThan(178);
  });
});

describe("scenario edits drive the real recommendation", () => {
  it("raising platelets to 350 adds a Khorana point", () => {
    const low = generateRecommendation(scenarioToPatient({ ...BASE, platelets: 300 }));
    const high = generateRecommendation(scenarioToPatient({ ...BASE, platelets: 350 }));
    expect(high.khorana.totalScore).toBe(low.khorana.totalScore + 1);
  });

  it("selecting myeloma yields the excluded pathway", () => {
    const p = scenarioToPatient({ ...BASE, conditionCode: "C90.00" });
    expect(generateRecommendation(p).overallAction).toBe("excluded");
  });

  it("the active-major-bleeding toggle flips a recommend patient to contraindicated", () => {
    // High-risk pancreatic scenario that otherwise recommends prophylaxis.
    const eligible = { ...BASE, platelets: 400, wbc: 12 };
    expect(
      generateRecommendation(scenarioToPatient(eligible)).overallAction,
    ).toBe("recommend");
    const bleeding = generateRecommendation(
      scenarioToPatient({ ...eligible, hasActiveMajorBleeding: true }),
    );
    expect(bleeding.overallAction).toBe("contraindicated");
    expect(bleeding.preferredOptions).toHaveLength(0);
  });

  it("ibrutinib on both DOACs forces the LMWH fallback (never dabi/edox)", () => {
    // Pancreas (2) + raise to high-risk so prophylaxis is indicated.
    const p = scenarioToPatient({
      ...BASE,
      platelets: 400,
      wbc: 12,
      medCodes: ["1442981"], // ibrutinib
    });
    const rec = generateRecommendation(p);
    expect(rec.khorana.totalScore).toBeGreaterThanOrEqual(2);
    expect(rec.preferredOptions).toHaveLength(0);
    expect(rec.alternativeOptions.map((o) => o.name).sort()).toEqual([
      "dalteparin",
      "enoxaparin",
    ]);
  });
});

describe("catalog + round-trip integrity", () => {
  it("every cancer option classifies to a known category", () => {
    for (const opt of CANCER_OPTIONS) {
      const p = scenarioToPatient({ ...BASE, conditionCode: opt.code });
      expect(p.activeCancerConditions[0].category).toBeDefined();
    }
  });

  it("the medication catalog is non-empty and unique by code", () => {
    const codes = MED_CATALOG.map((m) => m.code);
    expect(codes.length).toBeGreaterThan(50);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("patientToScenario round-trips through scenarioToPatient", () => {
    const p = scenarioToPatient(BASE);
    const s2 = patientToScenario(p);
    expect(s2.conditionCode).toBe(BASE.conditionCode);
    expect(s2.platelets).toBe(BASE.platelets);
    expect(s2.gender).toBe(BASE.gender);
  });
});
