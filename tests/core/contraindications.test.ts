/**
 * Contraindication detection unit tests (ERRATA Issues 9 & 10).
 * Reasons are snake_case; results use the nested ContraindicationResult shape;
 * HIT is appliesTo-aware (blocks LMWH only, DOACs remain available).
 */

import { describe, it, expect } from "vitest";
import {
  detectContraindications,
  type ContraindicationInput,
} from "../../src/core/contraindications";

function ci(overrides: Partial<ContraindicationInput> = {}): ContraindicationInput {
  return {
    conditions: [],
    plateletCount: 200,
    weightKg: 75,
    onAntiplatelet: false,
    onIMiD: false,
    ...overrides,
  };
}

describe("detectContraindications", () => {
  it("Test 1: severe thrombocytopenia (<50K) is a universal absolute", () => {
    const r = detectContraindications(ci({ plateletCount: 30 }));
    expect(
      r.absolute.some(
        (c) => c.reason === "severe_thrombocytopenia" && c.appliesTo === "all",
      ),
    ).toBe(true);
    expect(r.canProceedWithProphylaxis).toBe(false);
  });

  it("Test 2: platelets at/above 50K do not trigger thrombocytopenia", () => {
    const r = detectContraindications(ci({ plateletCount: 85 }));
    expect(r.absolute.some((c) => c.reason === "severe_thrombocytopenia")).toBe(
      false,
    );
  });

  it("Test 3: antiphospholipid syndrome (D68.61) is a universal absolute", () => {
    const r = detectContraindications(ci({ conditions: [{ code: "D68.61" }] }));
    expect(
      r.absolute.some(
        (c) =>
          c.reason === "antiphospholipid_syndrome" && c.appliesTo === "all",
      ),
    ).toBe(true);
    expect(r.canProceedWithProphylaxis).toBe(false);
  });

  it("Test 4: HIT (D75.82) blocks LMWH only (targeted appliesTo)", () => {
    const r = detectContraindications(ci({ conditions: [{ code: "D75.82" }] }));
    const hit = r.absolute.find((c) => c.reason === "hit");
    expect(hit).toBeDefined();
    expect(hit?.appliesTo).toEqual(["enoxaparin", "dalteparin"]);
  });

  it("Test 5: GI tract cancer (gastric C16) is a relative caution", () => {
    const r = detectContraindications(ci({ conditions: [{ code: "C16.9" }] }));
    expect(
      r.relative.some(
        (c) => c.reason === "gi_tract_cancer" && c.appliesTo === "all",
      ),
    ).toBe(true);
  });

  it("Test 6: concurrent antiplatelet is a relative caution", () => {
    const r = detectContraindications(ci({ onAntiplatelet: true }));
    expect(
      r.relative.some(
        (c) => c.reason === "concurrent_antiplatelet" && c.appliesTo === "all",
      ),
    ).toBe(true);
  });

  it("Test 7: low weight (<40 kg) is a relative caution for apixaban", () => {
    const r = detectContraindications(ci({ weightKg: 38 }));
    const lw = r.relative.find((c) => c.reason === "low_weight");
    expect(lw).toBeDefined();
    expect(lw?.appliesTo).toEqual(["apixaban"]);
  });

  it("Test 8: severe hepatic impairment (bili >3 AND AST/ALT >5x ULN) is absolute", () => {
    const r = detectContraindications(
      ci({ totalBilirubin: 4.0, ast: 250, alt: 60 }),
    );
    expect(
      r.absolute.some(
        (c) =>
          c.reason === "severe_hepatic_impairment" && c.appliesTo === "all",
      ),
    ).toBe(true);
    // High bilirubin alone (without transaminase elevation) must NOT trigger it.
    const r2 = detectContraindications(ci({ totalBilirubin: 4.0, ast: 30, alt: 30 }));
    expect(
      r2.absolute.some((c) => c.reason === "severe_hepatic_impairment"),
    ).toBe(false);
  });

  it("Test 9: HIT blocks LMWH but DOACs remain available", () => {
    const r = detectContraindications(
      ci({ conditions: [{ code: "D75.82" }], plateletCount: 85 }),
    );
    expect(r.absolute.some((c) => c.reason === "hit")).toBe(true);
    // No universal absolute -> prophylaxis (with a DOAC) can still proceed.
    expect(r.canProceedWithProphylaxis).toBe(true);
  });

  it("multiple myeloma on an IMiD is a relative caution", () => {
    const r = detectContraindications(
      ci({ conditions: [{ code: "C90.00" }], onIMiD: true }),
    );
    expect(r.relative.some((c) => c.reason === "multiple_myeloma_imid")).toBe(
      true,
    );
  });

  it("a clean patient has no contraindications and can proceed", () => {
    const r = detectContraindications(ci());
    expect(r.absolute).toHaveLength(0);
    expect(r.relative).toHaveLength(0);
    expect(r.canProceedWithProphylaxis).toBe(true);
  });
});
