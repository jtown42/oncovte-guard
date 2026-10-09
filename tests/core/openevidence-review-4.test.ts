/**
 * Regression tests for the OpenEvidence review 4 audit (2026-10-09;
 * docs/OPENEVIDENCE-REVIEW-4.md). Each block locks one applied change.
 */

import { describe, it, expect } from "vitest";
import { loadSyntheticPatient } from "../../src/fhir/standalone-loader";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { assessRenalFunction, calculateCrCl } from "../../src/core/renal-dosing";
import { getAnticoagulantRenalRecommendation } from "../../src/data/doac-renal-thresholds";
import { classifyIcd10 } from "../../src/data/icd10-cancer-map";
import { detectContraindications } from "../../src/core/contraindications";
import { checkDDIs } from "../../src/core/ddi-checker";
import { CancerCategory } from "../../src/types/khorana";
import type { PatientData } from "../../src/types/patient";

const NOW = new Date("2026-06-10T12:00:00Z");
const maria = () => assemblePatientData(loadSyntheticPatient(0), NOW);
const james = () => assemblePatientData(loadSyntheticPatient(1), NOW);

function med(rxnormCode: string, display: string) {
  return { rxnormCode, display, status: "active" as const };
}

/** Maria with her chemo replaced by one test drug (Khorana 5, normal renal). */
function mariaOn(rxnormCode: string, display: string): PatientData {
  return { ...maria(), activeMedications: [med(rxnormCode, display)] };
}

describe("Cockcroft-Gault uses adjusted body weight at BMI >= 30", () => {
  const obese = { age: 58, weightKg: 95, gender: "female" as const, serumCreatinine: 0.8, bmi: 36.2, heightCm: 162 };

  it("Maria: 85.3 mL/min with adjusted weight (115 with actual weight)", () => {
    expect(calculateCrCl(obese)).toBeCloseTo(85.3, 1);
    expect(calculateCrCl({ ...obese, heightCm: null })).toBeCloseTo(115.0, 0);
    expect(assessRenalFunction(obese).warnings).toContain("adjusted_body_weight");
  });

  it("BMI under 30 keeps actual weight", () => {
    expect(assessRenalFunction({ ...obese, bmi: 29.9 }).warnings).not.toContain("adjusted_body_weight");
  });
});

describe("apixaban is avoided below CrCl 15 and cautioned from 15 to 29", () => {
  it("boundaries", () => {
    expect(getAnticoagulantRenalRecommendation("apixaban", 14.9).recommendation).toBe("avoid");
    expect(getAnticoagulantRenalRecommendation("apixaban", 15).recommendation).toBe("caution");
    expect(getAnticoagulantRenalRecommendation("apixaban", 29.9).recommendation).toBe("caution");
    expect(getAnticoagulantRenalRecommendation("apixaban", 30).recommendation).toBe("standard");
  });
});

describe("classification and caution lists", () => {
  it("CML (C92.1x) is routed to the MPN exclusion", () => {
    const c = classifyIcd10("C92.10");
    expect(c.category).toBe(CancerCategory.EXCLUDED);
    expect(c.exclusionReason).toBe("mpn");
  });

  it("colorectal (C18) and upper-tract urothelial (C65) tumors raise the GI/GU caution", () => {
    for (const code of ["C18.4", "C20", "C65.1"]) {
      const r = detectContraindications({
        conditions: [{ code }], plateletCount: 200, weightKg: 70, onAntiplatelet: false, onIMiD: false,
      });
      expect(r.relative.some((x) => x.reason === "gi_tract_cancer"), code).toBe(true);
    }
  });
});

describe("interaction knowledge base v1.2.0", () => {
  it("rifampin, carbamazepine and phenytoin block both prophylaxis DOACs", () => {
    for (const [code, name] of [["9384", "rifampin"], ["2002", "carbamazepine"], ["8183", "phenytoin"]]) {
      const r = generateRecommendation(mariaOn(code, name));
      expect(r.preferredOptions, name).toHaveLength(0);
      expect(r.verdictLabel, name).toBe("recommend_lmwh");
    }
  });

  it("clarithromycin does not block a DOAC (both labels exempt it)", () => {
    const r = generateRecommendation(mariaOn("21212", "clarithromycin"));
    expect(r.preferredOptions.map((o) => o.name).sort()).toEqual(["apixaban", "rivaroxaban"]);
  });

  it("tucatinib is now major for both prophylaxis DOACs", () => {
    const r = checkDDIs({ rxnormCode: "2361285", display: "tucatinib" });
    expect(r.perDoac.apixaban.severity).toBe("major");
    expect(r.perDoac.rivaroxaban.severity).toBe("major");
  });

  it("inducer alerts say levels fall (clots); inhibitor alerts say levels rise (bleeding)", () => {
    const inducer = generateRecommendation(mariaOn("1307298", "enzalutamide"));
    const inhibitor = generateRecommendation(mariaOn("28031", "itraconazole"));
    const crit = (r: ReturnType<typeof generateRecommendation>) =>
      r.alerts.find((a) => a.level === "critical")!.detail;
    expect(crit(inducer)).toMatch(/lowers DOAC levels/);
    expect(crit(inducer)).not.toMatch(/bleeding risk/);
    expect(crit(inhibitor)).toMatch(/raises DOAC levels/);
  });

  it("second-generation BTK inhibitors carry a pharmacodynamic bleeding flag", () => {
    const r = generateRecommendation(mariaOn("1986808", "acalabrutinib"));
    expect(r.preferredOptions).toHaveLength(2);
    expect(r.alerts.some((a) => a.level === "warning" && /Additive bleeding risk/.test(a.title))).toBe(true);
  });
});

describe("LMWH dose at weight extremes (non-pancreatic)", () => {
  function jamesWith(weightKg: number, bmi: number) {
    return generateRecommendation({ ...james(), weightKg, bmi });
  }
  const dose = (r: ReturnType<typeof generateRecommendation>, n: string) => {
    const o = r.alternativeOptions.find((x) => x.name === n)!;
    return `${o.dose} ${o.frequency}`;
  };

  it("BMI >= 40: enoxaparin 40 mg every 12 hours, dalteparin 7,500 units daily", () => {
    const r = jamesWith(125, 40.8);
    expect(dose(r, "enoxaparin")).toBe("40 mg every 12 hours");
    expect(dose(r, "dalteparin")).toBe("7,500 units daily");
  });

  it("weight 41–50 kg: enoxaparin 30 mg, dalteparin 2,500 units", () => {
    const r = jamesWith(48, 15.7);
    expect(dose(r, "enoxaparin")).toBe("30 mg daily");
    expect(dose(r, "dalteparin")).toBe("2,500 units daily");
  });
});

describe("James's bundle", () => {
  it("carries a mildly elevated, sub-threshold hepatic panel that does not block a DOAC", () => {
    const p = james();
    expect(p.labs.alt?.value).toBe(68);
    expect(p.labs.ast?.value).toBe(54);
    const r = generateRecommendation(p);
    expect(r.contraindications.absolute.some((c) => c.reason === "severe_hepatic_impairment")).toBe(false);
    expect(r.verdictLabel).toBe("recommend_lmwh");
  });
});
