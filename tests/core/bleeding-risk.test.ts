/**
 * WS-2: qualitative bleeding-risk panel.
 *
 * The panel is a list of guideline-named factors, NOT a score. These tests cover
 * one assertion per factor plus the three tier boundaries (elevated / standard /
 * insufficient_data) and the threshold edges.
 */

import { describe, it, expect } from "vitest";
import {
  assessBleedingRisk,
  BLEEDING_RISK_THRESHOLDS,
  type BleedingRiskInput,
} from "../../src/core/bleeding-risk";

/** A clean, fully-specified, low-risk patient; override per test. */
function bri(overrides: Partial<BleedingRiskInput> = {}): BleedingRiskInput {
  return {
    conditions: [],
    crclMlMin: 90,
    weightKg: 70,
    hemoglobin: 13,
    plateletCount: 250,
    onAntiplatelet: false,
    ...overrides,
  };
}

function hasFactor(input: BleedingRiskInput, key: string): boolean {
  return assessBleedingRisk(input).factors.some((f) => f.key === key);
}

describe("assessBleedingRisk — factors", () => {
  it("Factor 1: gastric/GEJ tumor (C16) is elevated and prefers LMWH", () => {
    const r = assessBleedingRisk(bri({ conditions: [{ code: "C16.9" }] }));
    expect(r.tier).toBe("elevated");
    const f = r.factors.find((x) => x.key === "gastric_gej_tumor");
    expect(f).toBeDefined();
    expect(f?.prefersLmwh).toBe(true);
    expect(f?.source).toBe("NCCN VTE-2");
    expect(r.prefersLmwh).toBe(true);
  });

  it("Factor 2: unresected luminal GI tumor (colon C18)", () => {
    expect(hasFactor(bri({ conditions: [{ code: "C18.9" }] }), "luminal_gi_tumor")).toBe(true);
  });

  it("Factor 3: urothelial/gyn tumor (cervical C53)", () => {
    expect(hasFactor(bri({ conditions: [{ code: "C53.9" }] }), "urothelial_or_gyn_tumor")).toBe(true);
  });

  it("Factor 4: RCC (C64) or melanoma", () => {
    expect(hasFactor(bri({ conditions: [{ code: "C64.9" }] }), "rcc_or_melanoma")).toBe(true);
    expect(hasFactor(bri({ conditions: [{ code: "C43.9" }] }), "rcc_or_melanoma")).toBe(true);
  });

  it("Factor 5: CrCl <30 is elevated and prefers LMWH", () => {
    const r = assessBleedingRisk(bri({ crclMlMin: 12.9 }));
    expect(r.factors.some((f) => f.key === "severe_renal_impairment")).toBe(true);
    expect(r.prefersLmwh).toBe(true);
  });

  it("Factor 6: low body weight <50 kg", () => {
    expect(hasFactor(bri({ weightKg: 48 }), "low_body_weight")).toBe(true);
  });

  it("Factor 7: anemia (Hgb <10)", () => {
    expect(hasFactor(bri({ hemoglobin: 9 }), "anemia")).toBe(true);
  });

  it("Factor 8: thrombocytopenia (<100)", () => {
    expect(hasFactor(bri({ plateletCount: 80 }), "thrombocytopenia")).toBe(true);
  });

  it("Factor 9: anorexia / vomiting flag", () => {
    expect(hasFactor(bri({ hasAnorexiaOrVomiting: true }), "anorexia_or_vomiting")).toBe(true);
  });

  it("Factor 10: frailty / ECOG 3–4 flag prefers LMWH", () => {
    const r = assessBleedingRisk(bri({ isFrailOrPoorPerformance: true }));
    expect(r.factors.some((f) => f.key === "frailty_or_ecog_3_4")).toBe(true);
    expect(r.prefersLmwh).toBe(true);
  });

  it("Factor 11: systemic corticosteroid", () => {
    expect(hasFactor(bri({ onCorticosteroid: true }), "systemic_corticosteroid")).toBe(true);
  });

  it("Factor 12: concurrent antiplatelet OR NSAID", () => {
    expect(hasFactor(bri({ onAntiplatelet: true }), "antiplatelet_or_nsaid")).toBe(true);
    expect(hasFactor(bri({ onNSAID: true }), "antiplatelet_or_nsaid")).toBe(true);
  });

  it("Factor 13: prior major bleeding", () => {
    expect(hasFactor(bri({ hasPriorMajorBleeding: true }), "prior_major_bleeding")).toBe(true);
  });
});

describe("assessBleedingRisk — tiers and boundaries", () => {
  it("a clean, fully-specified patient is 'standard' with no factors", () => {
    const r = assessBleedingRisk(bri());
    expect(r.tier).toBe("standard");
    expect(r.factors).toHaveLength(0);
    expect(r.prefersLmwh).toBe(false);
  });

  it("no factor but a missing core input → 'insufficient_data'", () => {
    const r = assessBleedingRisk(bri({ crclMlMin: null }));
    expect(r.tier).toBe("insufficient_data");
    expect(r.missingInputs).toContain("crcl");
  });

  it("a present factor overrides missing inputs → still 'elevated'", () => {
    const r = assessBleedingRisk(
      bri({ crclMlMin: null, weightKg: 48 }),
    );
    expect(r.tier).toBe("elevated");
  });

  it("threshold edges do NOT fire (CrCl 30, weight 50, Hgb 10, plt 100)", () => {
    const t = BLEEDING_RISK_THRESHOLDS;
    const r = assessBleedingRisk(
      bri({
        crclMlMin: t.SEVERE_CRCL_LT, // 30
        weightKg: t.LOW_WEIGHT_LT, // 50
        hemoglobin: t.ANEMIA_HGB_LT, // 10
        plateletCount: t.THROMBOCYTOPENIA_LT, // 100
      }),
    );
    expect(r.tier).toBe("standard");
  });

  it("every profile carries the honest 'not a score' disclaimer", () => {
    for (const input of [bri(), bri({ crclMlMin: 12 }), bri({ crclMlMin: null })]) {
      expect(assessBleedingRisk(input).disclaimer).toMatch(/NOT a score/);
      expect(assessBleedingRisk(input).disclaimer).toMatch(/0\.50–0\.70/);
    }
  });
});
