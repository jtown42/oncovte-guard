/**
 * Renal dosing unit tests.
 * Cockcroft-Gault CrCl, banding, the six-entry recommendation array + lookup
 * helper (ERRATA Issue 8), and contextual warnings.
 */

import { describe, it, expect } from "vitest";
import {
  assessRenalFunction,
  calculateCrCl,
  categorizeCrCl,
  getRenalRecommendation,
} from "../../src/core/renal-dosing";
import type { RenalInput } from "../../src/types/renal";

function renalInput(overrides: Partial<RenalInput> = {}): RenalInput {
  return {
    age: 60,
    weightKg: 80,
    gender: "male",
    serumCreatinine: 1.0,
    ...overrides,
  };
}

describe("calculateCrCl (Cockcroft-Gault)", () => {
  it("Test 1: male 60y, 80kg, SCr 1.0 -> 88.9 mL/min", () => {
    expect(calculateCrCl(renalInput())).toBeCloseTo(88.9, 1);
  });

  it("Test 2: female applies the 0.85 factor", () => {
    expect(calculateCrCl(renalInput({ gender: "female" }))).toBeCloseTo(75.6, 1);
  });

  it("Test 3: severe impairment (70y male, 70kg, SCr 3.0) -> ~22.7, severe", () => {
    const input = renalInput({ age: 70, weightKg: 70, serumCreatinine: 3.0 });
    const crcl = calculateCrCl(input);
    expect(crcl).toBeCloseTo(22.7, 1);
    expect(categorizeCrCl(crcl)).toBe("severe");
  });

  it("Test 4: young healthy patient -> normal band", () => {
    const crcl = calculateCrCl(
      renalInput({ age: 30, weightKg: 80, serumCreatinine: 0.8 }),
    );
    expect(crcl).toBeCloseTo(152.8, 1);
    expect(categorizeCrCl(crcl)).toBe("normal");
  });

  it("Test 5: non-positive creatinine is guarded (returns 0)", () => {
    expect(calculateCrCl(renalInput({ serumCreatinine: 0 }))).toBe(0);
  });
});

describe("categorizeCrCl bands", () => {
  it("normal >=90, mild 60-89, moderate 30-59, severe <30", () => {
    expect(categorizeCrCl(90)).toBe("normal");
    expect(categorizeCrCl(89.9)).toBe("mild");
    expect(categorizeCrCl(60)).toBe("mild");
    expect(categorizeCrCl(59.9)).toBe("moderate");
    expect(categorizeCrCl(30)).toBe("moderate");
    expect(categorizeCrCl(29.9)).toBe("severe");
  });
});

describe("assessRenalFunction", () => {
  it("Test 6: always reports six anticoagulants (ERRATA Issue 8)", () => {
    const r = assessRenalFunction(renalInput());
    expect(r.doacRecommendations).toHaveLength(6);
    expect(r.doacRecommendations.map((d) => d.doac).sort()).toEqual(
      [
        "apixaban",
        "dabigatran",
        "dalteparin",
        "edoxaban",
        "enoxaparin",
        "rivaroxaban",
      ].sort(),
    );
  });

  it("Test 7: getRenalRecommendation looks up a single agent", () => {
    const r = assessRenalFunction(renalInput());
    const apix = getRenalRecommendation(r, "apixaban");
    expect(apix?.recommendation).toBe("standard");
    expect(getRenalRecommendation(r, "nonexistent")).toBeUndefined();
  });

  it("Test 8: low body weight raises the sarcopenia warning", () => {
    const r = assessRenalFunction(renalInput({ weightKg: 52 }));
    expect(r.warnings).toContain("sarcopenia");
  });

  it("Test 9: active nephrotoxic chemo raises a warning", () => {
    const r = assessRenalFunction(
      renalInput({ medications: [{ rxnormCode: "2555" }] }), // cisplatin
    );
    expect(r.warnings).toContain("nephrotoxic_chemotherapy");
  });

  it("Test 10: at CrCl <30, apixaban=caution, rivaroxaban/LMWH=avoid", () => {
    const r = assessRenalFunction(
      renalInput({ age: 70, weightKg: 70, serumCreatinine: 3.0 }),
    );
    expect(r.crclCategory).toBe("severe");
    expect(getRenalRecommendation(r, "apixaban")?.recommendation).toBe("caution");
    expect(getRenalRecommendation(r, "rivaroxaban")?.recommendation).toBe("avoid");
    expect(getRenalRecommendation(r, "enoxaparin")?.recommendation).toBe("avoid");
    expect(getRenalRecommendation(r, "dalteparin")?.recommendation).toBe("avoid");
  });
});
