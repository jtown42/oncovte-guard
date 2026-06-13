/**
 * Khorana engine unit tests.
 * Covers scoring, NCCN-aligned risk tiers (ERRATA Issue 2), the score cap of 6
 * (ERRATA Issue 1), boundary behavior, missing-field tracking, and the nested
 * exclusion shape with snake_case reasons (ERRATA Issue 10).
 */

import { describe, it, expect } from "vitest";
import {
  calculateKhoranaScore,
  calculateKhoranaScoreFromConditions,
  getCancerCategory,
  riskCategoryForScore,
} from "../../src/core/khorana-engine";
import {
  CancerCategory,
  RiskCategory,
  MAX_KHORANA_SCORE,
  type KhoranaInput,
} from "../../src/types/khorana";

/** Build a fully-specified KhoranaInput; override per test. */
function input(overrides: Partial<KhoranaInput> = {}): KhoranaInput {
  return {
    cancerCategory: CancerCategory.STANDARD,
    exclusionReason: null,
    plateletCount: 200,
    hemoglobin: 13,
    onESA: false,
    wbcCount: 8,
    bmi: 25,
    ...overrides,
  };
}

describe("calculateKhoranaScore", () => {
  it("Test 1: pancreatic + thrombocytosis + anemia + obesity = 5, High, prophylaxis", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C25.1" }],
      plateletCount: 410,
      hemoglobin: 9.2,
      onESA: false,
      wbcCount: 8.5,
      bmi: 36.2,
    });
    expect(r.totalScore).toBe(5);
    expect(r.riskCategory).toBe(RiskCategory.HIGH);
    expect(r.prophylaxisRecommended).toBe(true);
    expect(r.breakdown.cancerSite.score).toBe(2);
    expect(r.breakdown.platelets.score).toBe(1);
    expect(r.breakdown.hemoglobin.score).toBe(1);
    expect(r.breakdown.wbc.score).toBe(0);
    expect(r.breakdown.bmi.score).toBe(1);
  });

  it("Test 2: gastric with normal labs = 2, Intermediate, prophylaxis", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C16.9" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.totalScore).toBe(2);
    expect(r.riskCategory).toBe(RiskCategory.INTERMEDIATE);
    expect(r.prophylaxisRecommended).toBe(true);
  });

  it("Test 3: lung with normal labs = 1, Intermediate, no prophylaxis", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C34.1" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.totalScore).toBe(1);
    expect(r.riskCategory).toBe(RiskCategory.INTERMEDIATE);
    expect(r.prophylaxisRecommended).toBe(false);
  });

  it("Test 4: standard-site tumor with normal labs = 0, Low", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C50.9" }], // breast = standard
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.totalScore).toBe(0);
    expect(r.riskCategory).toBe(RiskCategory.LOW);
    expect(r.breakdown.cancerSite.score).toBe(0);
  });

  it("Test 5: platelets exactly 350 score (>= boundary)", () => {
    const r = calculateKhoranaScore(input({ plateletCount: 350 }));
    expect(r.breakdown.platelets.score).toBe(1);
  });

  it("Test 6: platelets 349 do not score", () => {
    const r = calculateKhoranaScore(input({ plateletCount: 349 }));
    expect(r.breakdown.platelets.score).toBe(0);
  });

  it("Test 7: hemoglobin exactly 10.0 does NOT score", () => {
    const r = calculateKhoranaScore(input({ hemoglobin: 10.0 }));
    expect(r.breakdown.hemoglobin.score).toBe(0);
  });

  it("Test 8: hemoglobin 9.9 scores", () => {
    const r = calculateKhoranaScore(input({ hemoglobin: 9.9 }));
    expect(r.breakdown.hemoglobin.score).toBe(1);
  });

  it("Test 9: ESA use scores the hemoglobin criterion even with normal Hgb", () => {
    const r = calculateKhoranaScore(input({ hemoglobin: 13, onESA: true }));
    expect(r.breakdown.hemoglobin.score).toBe(1);
    expect(r.breakdown.hemoglobin.esaFlag).toBe(true);
  });

  it("Test 10: WBC exactly 11.0 does NOT score", () => {
    const r = calculateKhoranaScore(input({ wbcCount: 11.0 }));
    expect(r.breakdown.wbc.score).toBe(0);
  });

  it("Test 11: WBC 11.1 scores", () => {
    const r = calculateKhoranaScore(input({ wbcCount: 11.1 }));
    expect(r.breakdown.wbc.score).toBe(1);
  });

  it("Test 12: BMI exactly 35.0 scores (>= boundary)", () => {
    const r = calculateKhoranaScore(input({ bmi: 35.0 }));
    expect(r.breakdown.bmi.score).toBe(1);
  });

  it("Test 13: BMI 34.9 does not score", () => {
    const r = calculateKhoranaScore(input({ bmi: 34.9 }));
    expect(r.breakdown.bmi.score).toBe(0);
  });

  it("Test 14: null platelets -> missingFields + isComplete false", () => {
    const r = calculateKhoranaScore(input({ plateletCount: null }));
    expect(r.missingFields).toContain("plateletCount");
    expect(r.isComplete).toBe(false);
    expect(r.breakdown.platelets.score).toBe(0);
  });

  it("Test 15: maximum score is capped at 6 (ERRATA Issue 1)", () => {
    const r = calculateKhoranaScore(
      input({
        cancerCategory: CancerCategory.VERY_HIGH,
        plateletCount: 500,
        hemoglobin: 8,
        wbcCount: 15,
        bmi: 40,
      }),
    );
    expect(r.totalScore).toBe(MAX_KHORANA_SCORE);
    expect(r.totalScore).toBe(6);
    expect(r.riskCategory).toBe(RiskCategory.HIGH);
  });

  it("Test 16: multiple myeloma is excluded (nested shape, snake_case reason)", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C90.00" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.exclusion.isExcluded).toBe(true);
    expect(r.exclusion.reason).toBe("multiple_myeloma");
    expect(r.totalScore).toBe(0);
    expect(r.prophylaxisRecommended).toBe(false);
  });

  it("Test 17: brain tumor is excluded", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C71.9" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.exclusion.isExcluded).toBe(true);
    expect(r.exclusion.reason).toBe("brain_tumor");
  });

  it("Test 18: acute leukemia is excluded", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C92.00" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.exclusion.isExcluded).toBe(true);
    expect(r.exclusion.reason).toBe("acute_leukemia");
  });

  it("Test 19: myeloproliferative neoplasm is excluded", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "D45" }],
      plateletCount: 200,
      hemoglobin: 13,
      onESA: false,
      wbcCount: 8,
      bmi: 25,
    });
    expect(r.exclusion.isExcluded).toBe(true);
    expect(r.exclusion.reason).toBe("mpn");
  });

  it("Test 20: score 1 is Intermediate Risk, no prophylaxis (Khorana/NCCN VTE-C tiering)", () => {
    const r = calculateKhoranaScoreFromConditions({
      conditions: [{ code: "C83.1" }], // NHL = high site, 1 pt
      plateletCount: 200,
      hemoglobin: 12.0,
      onESA: false,
      wbcCount: 8.0,
      bmi: 28.0,
    });
    expect(r.totalScore).toBe(1);
    // Original Khorana model / NCCN VTE-C: 1-2 = Intermediate (not Low).
    expect(r.riskCategory).toBe(RiskCategory.INTERMEDIATE);
    // The actionable threshold is still >=2, so prophylaxis remains not indicated.
    expect(r.prophylaxisRecommended).toBe(false);
  });
});

describe("getCancerCategory precedence", () => {
  it("exclusion dominates a co-occurring scorable tumor", () => {
    const res = getCancerCategory([{ code: "C25.1" }, { code: "C90.00" }]);
    expect(res.category).toBe(CancerCategory.EXCLUDED);
    expect(res.exclusionReason).toBe("multiple_myeloma");
  });

  it("highest-scoring site governs when no exclusion present", () => {
    const res = getCancerCategory([{ code: "C50.9" }, { code: "C25.1" }]);
    expect(res.category).toBe(CancerCategory.VERY_HIGH);
  });

  it("no conditions resolves to STANDARD", () => {
    const res = getCancerCategory([]);
    expect(res.category).toBe(CancerCategory.STANDARD);
  });
});

describe("riskCategoryForScore", () => {
  it("maps 0 -> low; 1,2 -> intermediate; 3+ -> high (Khorana/NCCN VTE-C)", () => {
    expect(riskCategoryForScore(0)).toBe(RiskCategory.LOW);
    expect(riskCategoryForScore(1)).toBe(RiskCategory.INTERMEDIATE);
    expect(riskCategoryForScore(2)).toBe(RiskCategory.INTERMEDIATE);
    expect(riskCategoryForScore(3)).toBe(RiskCategory.HIGH);
    expect(riskCategoryForScore(6)).toBe(RiskCategory.HIGH);
  });
});

describe("cancer-site advisory notes", () => {
  it("lung cancer (C34) carries the limited-discrimination advisory note", () => {
    const res = getCancerCategory([{ code: "C34.1" }]);
    expect(res.category).toBe(CancerCategory.HIGH);
    expect(res.note).toMatch(/lung/i);
  });

  it("kidney cancer (C64) carries the NCCN-divergence advisory note", () => {
    const res = getCancerCategory([{ code: "C64.9" }]);
    expect(res.category).toBe(CancerCategory.HIGH);
    expect(res.note).toMatch(/kidney|renal/i);
  });

  it("a standard site carries no advisory note", () => {
    const res = getCancerCategory([{ code: "C50.9" }]); // breast
    expect(res.note).toBeNull();
  });
});
