/**
 * Recommendation orchestration integration tests.
 * Exercises the end-to-end pathways and the errata contracts that only emerge
 * when the modules are wired together:
 *   - ERRATA Issue 2: Khorana >=2 gate.
 *   - ERRATA Issue 4: if both DOACs are blocked, fall back to LMWH — never to
 *     dabigatran/edoxaban; reference DOACs never appear as prophylaxis options.
 *   - ERRATA Issue 9: a HIT patient keeps DOAC options (LMWH blocked only).
 */

import { describe, it, expect } from "vitest";
import { generateRecommendation } from "../../src/core/recommendation";
import type {
  PatientData,
  LabValue,
  MedicationItem,
  CancerConditionItem,
} from "../../src/types/patient";
import { classifyIcd10 } from "../../src/data/icd10-cancer-map";
import { LOINC } from "../../src/data/loinc-codes";

function lab(value: number, loincCode: string): LabValue {
  return {
    value,
    unit: "",
    date: new Date().toISOString(),
    loincCode,
    isStale: false,
  };
}

function condition(code: string, display = code): CancerConditionItem {
  return { code, display, category: classifyIcd10(code).category };
}

/** Build a PatientData with sensible defaults; override per scenario. */
function patient(overrides: Partial<PatientData> = {}): PatientData {
  const base: PatientData = {
    id: "test",
    name: "Test Patient",
    birthDate: "1968-01-01",
    age: 58,
    gender: "female",
    race: null,
    ethnicity: null,
    weightKg: 80,
    heightCm: 165,
    bmi: 36.2,
    activeCancerConditions: [condition("C25.1", "Pancreatic adenocarcinoma")],
    labs: {
      platelets: lab(410, LOINC.PLATELETS),
      hemoglobin: lab(9.2, LOINC.HEMOGLOBIN),
      wbc: lab(8.5, LOINC.WBC),
      serumCreatinine: lab(0.7, LOINC.SERUM_CREATININE),
      alt: lab(20, LOINC.ALT),
      ast: lab(22, LOINC.AST),
      totalBilirubin: lab(0.8, LOINC.TOTAL_BILIRUBIN),
    },
    activeMedications: [],
    onESA: false,
    onAntiplatelet: false,
    onIMiD: false,
    hasNephrotoxicChemo: false,
    hasActiveMajorBleeding: false,
  };
  return { ...base, ...overrides };
}

const ibrutinib: MedicationItem = {
  rxnormCode: "1442981",
  display: "ibrutinib",
  status: "active",
};

describe("generateRecommendation", () => {
  it("high-Khorana pancreatic patient with no DDI -> recommend apixaban + rivaroxaban", () => {
    const r = generateRecommendation(patient());
    expect(r.khorana.totalScore).toBeGreaterThanOrEqual(2);
    expect(r.overallAction).toBe("recommend");
    const names = r.preferredOptions.map((o) => o.name).sort();
    expect(names).toEqual(["apixaban", "rivaroxaban"]);
    expect(
      r.preferredOptions.every((o) => o.hasNccnProphylaxisIndication),
    ).toBe(true);
  });

  it("excluded population (myeloma) -> overallAction 'excluded'", () => {
    const r = generateRecommendation(
      patient({ activeCancerConditions: [condition("C90.00", "Myeloma")] }),
    );
    expect(r.overallAction).toBe("excluded");
    expect(r.preferredOptions).toHaveLength(0);
  });

  it("Khorana <2 -> not_indicated", () => {
    const r = generateRecommendation(
      patient({
        activeCancerConditions: [condition("C34.1", "Lung")],
        bmi: 24,
        labs: {
          platelets: lab(200, LOINC.PLATELETS),
          hemoglobin: lab(13, LOINC.HEMOGLOBIN),
          wbc: lab(8, LOINC.WBC),
          serumCreatinine: lab(0.7, LOINC.SERUM_CREATININE),
          alt: lab(20, LOINC.ALT),
          ast: lab(22, LOINC.AST),
          totalBilirubin: lab(0.8, LOINC.TOTAL_BILIRUBIN),
        },
      }),
    );
    expect(r.overallAction).toBe("not_indicated");
  });

  it("universal absolute contraindication (severe thrombocytopenia) -> contraindicated", () => {
    const r = generateRecommendation(
      patient({
        labs: { ...patient().labs, platelets: lab(30, LOINC.PLATELETS) },
      }),
    );
    expect(r.overallAction).toBe("contraindicated");
    expect(r.preferredOptions).toHaveLength(0);
  });

  it("active major bleeding (clinician flag) on an otherwise-recommend patient -> contraindicated", () => {
    // Baseline patient() is a high-Khorana pancreatic case that otherwise
    // recommends apixaban + rivaroxaban (see first test).
    const recommended = generateRecommendation(patient());
    expect(recommended.overallAction).toBe("recommend");

    const bleeding = generateRecommendation(
      patient({ hasActiveMajorBleeding: true }),
    );
    expect(bleeding.overallAction).toBe("contraindicated");
    expect(bleeding.preferredOptions).toHaveLength(0);
    expect(bleeding.alternativeOptions).toHaveLength(0);
    expect(
      bleeding.contraindications.absolute.some(
        (c) => c.reason === "active_major_bleeding" && c.appliesTo === "all",
      ),
    ).toBe(true);
  });

  it("ERRATA Issue 4: major DDI on both DOACs -> LMWH fallback, no dabi/edox option", () => {
    const r = generateRecommendation(
      patient({ activeMedications: [ibrutinib] }),
    );
    // Apixaban + rivaroxaban both blocked by the major ibrutinib interaction.
    expect(r.preferredOptions).toHaveLength(0);
    // LMWH offered as the alternative...
    const altNames = r.alternativeOptions.map((o) => o.name).sort();
    expect(altNames).toEqual(["dalteparin", "enoxaparin"]);
    // ...and dabigatran/edoxaban are NEVER presented as prophylaxis options.
    const offered = [...r.preferredOptions, ...r.alternativeOptions].map(
      (o) => o.name,
    );
    expect(offered).not.toContain("dabigatran");
    expect(offered).not.toContain("edoxaban");
  });

  it("ERRATA Issue 9: HIT blocks LMWH but DOACs remain the recommendation", () => {
    const r = generateRecommendation(
      patient({
        activeCancerConditions: [
          condition("C25.1", "Pancreatic adenocarcinoma"),
          condition("D75.82", "HIT"),
        ],
      }),
    );
    // Not globally contraindicated — DOACs are preferred in HIT.
    expect(r.overallAction).not.toBe("contraindicated");
    const preferred = r.preferredOptions.map((o) => o.name).sort();
    expect(preferred).toEqual(["apixaban", "rivaroxaban"]);
    // LMWH are blocked and surfaced as avoid.
    const avoidNames = r.avoidOptions.map((o) => o.name);
    expect(avoidNames).toContain("enoxaparin");
    expect(avoidNames).toContain("dalteparin");
  });
});
