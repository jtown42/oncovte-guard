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

  it("Test 1b (WS-1.2): thrombocytopenia cites NCCN VTE-B-2 + VTE-F and states DOACs not recommended", () => {
    const r = detectContraindications(ci({ plateletCount: 30 }));
    const tc = r.absolute.find((c) => c.reason === "severe_thrombocytopenia");
    expect(tc?.source).toBe("NCCN VTE-B-2 (per-agent); VTE-F");
    expect(tc?.detail).toMatch(/does not recommend DOAC use below a platelet count of 50,000/i);
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

  it("Test 7 (WS-1.1): weight <40 kg is a TARGETED ABSOLUTE for apixaban, not relative", () => {
    const r = detectContraindications(ci({ weightKg: 38 }));
    const lw = r.absolute.find((c) => c.reason === "weight_below_40kg");
    expect(lw).toBeDefined();
    expect(lw?.type).toBe("absolute");
    expect(lw?.appliesTo).toEqual(["apixaban"]);
    expect(lw?.source).toBe("NCCN VTE-B-2");
    // No longer a relative caution.
    expect(r.relative.some((c) => c.reason === "weight_below_40kg")).toBe(false);
    // Targeted (not universal) -> prophylaxis with another agent still proceeds.
    expect(r.canProceedWithProphylaxis).toBe(true);
  });

  it("Test 7b (WS-1.1): weight at/above 40 kg does not trigger the apixaban block", () => {
    const r = detectContraindications(ci({ weightKg: 40 }));
    expect(r.absolute.some((c) => c.reason === "weight_below_40kg")).toBe(false);
  });

  // --- Hepatic: per-agent NCCN VTE-D-5 (v1.2026), re-anchored in WS-1.4. ---
  // Defaults: ULN 40 U/L for ALT/AST, 1.2 mg/dL for total bilirubin.

  it("Test 8 (WS-1.4): hepatic is per-agent/targeted, never a universal absolute", () => {
    const r = detectContraindications(ci({ ast: 130, alt: 130, totalBilirubin: 3 }));
    const hep = r.absolute.filter((c) => c.reason === "severe_hepatic_impairment");
    expect(hep.length).toBeGreaterThan(0);
    // Every hepatic finding is targeted (appliesTo = [agent]), so no universal absolute.
    expect(hep.every((c) => Array.isArray(c.appliesTo))).toBe(true);
    expect(hep.every((c) => c.source === "NCCN VTE-D-5 (v1.2026)")).toBe(true);
  });

  it("Test 8a (WS-1.4): CLOSED GAP — AST ~4x ULN, normal bilirubin blocks apixaban & rivaroxaban", () => {
    // AST 160 = 4x ULN (40); the old bili>3 AND transaminase>5x gate PASSED this.
    const r = detectContraindications(ci({ ast: 160, alt: 30, totalBilirubin: 0.8 }));
    const agents = r.absolute
      .filter((c) => c.reason === "severe_hepatic_impairment")
      .flatMap((c) => (Array.isArray(c.appliesTo) ? c.appliesTo : []));
    expect(agents).toContain("apixaban"); // >3x ULN
    expect(agents).toContain("rivaroxaban"); // >3x ULN
    expect(agents).toContain("dabigatran"); // >2x ULN
    expect(agents).not.toContain("edoxaban"); // needs transaminase>3x AND bili>2x
    // Targeted -> prophylaxis can still proceed (falls back to LMWH).
    expect(r.canProceedWithProphylaxis).toBe(true);
  });

  it("Test 8b (WS-1.4): isolated bilirubin >2x ULN blocks apixaban only", () => {
    // Bilirubin 3.0 = 2.5x ULN (1.2); transaminases normal.
    const r = detectContraindications(ci({ totalBilirubin: 3.0, ast: 30, alt: 30 }));
    const agents = r.absolute
      .filter((c) => c.reason === "severe_hepatic_impairment")
      .flatMap((c) => (Array.isArray(c.appliesTo) ? c.appliesTo : []));
    expect(agents).toEqual(["apixaban"]); // only apixaban has a bilirubin arm
  });

  it("Test 8c (WS-1.4): edoxaban is conjunctive (needs transaminase>3x AND bilirubin>2x)", () => {
    // Transaminase high, bilirubin normal -> edoxaban NOT blocked.
    const r1 = detectContraindications(ci({ ast: 160, totalBilirubin: 0.8 }));
    const a1 = r1.absolute
      .filter((c) => c.reason === "severe_hepatic_impairment")
      .flatMap((c) => (Array.isArray(c.appliesTo) ? c.appliesTo : []));
    expect(a1).not.toContain("edoxaban");
    // Both high -> edoxaban blocked.
    const r2 = detectContraindications(ci({ ast: 160, totalBilirubin: 3.0 }));
    const a2 = r2.absolute
      .filter((c) => c.reason === "severe_hepatic_impairment")
      .flatMap((c) => (Array.isArray(c.appliesTo) ? c.appliesTo : []));
    expect(a2).toContain("edoxaban");
  });

  it("Test 8d (WS-1.4): normal hepatic panel triggers nothing", () => {
    const r = detectContraindications(ci({ ast: 30, alt: 30, totalBilirubin: 0.8 }));
    expect(r.absolute.some((c) => c.reason === "severe_hepatic_impairment")).toBe(
      false,
    );
  });

  it("Test 8e (WS-1.4): thresholds are ULN multiples, honoring per-lab overrides", () => {
    // With ULN 80, AST 160 is only 2x ULN -> below apixaban's >3x, above dabigatran's >2x? (=2x, not >2x)
    const r = detectContraindications(ci({ ast: 160, astUln: 80 }));
    const agents = r.absolute
      .filter((c) => c.reason === "severe_hepatic_impairment")
      .flatMap((c) => (Array.isArray(c.appliesTo) ? c.appliesTo : []));
    // 2x ULN exactly: not > 3x, not > 2x -> no agent trips.
    expect(agents).toHaveLength(0);
  });

  it("Test 8f (WS-1.4): hepatic detail states the Child-Pugh caveat", () => {
    const r = detectContraindications(ci({ ast: 160 }));
    const hep = r.absolute.find((c) => c.reason === "severe_hepatic_impairment");
    expect(hep?.detail).toMatch(/Child-Pugh B\/C is a separate NCCN contraindication/i);
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
