/**
 * DDI checker unit tests (ERRATA Issue 7).
 * checkDDIs() always returns the full per-DOAC shape; getWorstDDIForDoac()
 * aggregates across medications. Severity ranking for "worst":
 *   major > moderate > pharmacodynamic > minor > none > unknown.
 */

import { describe, it, expect } from "vitest";
import {
  checkDDIs,
  getWorstDDIForDoac,
  worseSeverity,
} from "../../src/core/ddi-checker";

describe("checkDDIs", () => {
  it("Test 1: itraconazole (combined P-gp + strong CYP3A4 inhibitor) is major for both prophylaxis DOACs", () => {
    const r = checkDDIs({ rxnormCode: "28031", display: "itraconazole" });
    expect(r.perDoac.apixaban.severity).toBe("major");
    expect(r.perDoac.rivaroxaban.severity).toBe("major");
    expect(r.perDoac.dabigatran.severity).toBe("major") // OpenEvidence review 4: P-gp inhibition; EU SmPC contraindicates;
    expect(r.perDoac.edoxaban.severity).toBe("moderate");
    expect(r.worstSeverity).toBe("major");
  });

  it("Test 1b (regression, 2026-10-09): ibrutinib is pharmacodynamic for factor Xa inhibitors, major only for dabigatran", () => {
    // Ibrutinib is a CYP3A4 substrate, not a strong inhibitor; its bleeding risk
    // with anticoagulants is platelet-mediated. ACC 2025: factor Xa inhibitors
    // preferred, dabigatran avoided. It must never block apixaban/rivaroxaban.
    const r = checkDDIs({ rxnormCode: "1442981", display: "ibrutinib" });
    expect(r.perDoac.apixaban.severity).toBe("pharmacodynamic");
    expect(r.perDoac.rivaroxaban.severity).toBe("pharmacodynamic");
    expect(r.perDoac.edoxaban.severity).toBe("pharmacodynamic");
    expect(r.perDoac.dabigatran.severity).toBe("major");
    expect(r.perDoac.apixaban.mechanism).not.toMatch(/strong/i);
  });

  it("Test 2: gemcitabine has no interactions", () => {
    const r = checkDDIs({ rxnormCode: "12574", display: "gemcitabine" });
    expect(r.perDoac.apixaban.severity).toBe("none");
    expect(r.perDoac.rivaroxaban.severity).toBe("none");
    expect(r.perDoac.dabigatran.severity).toBe("none");
    expect(r.perDoac.edoxaban.severity).toBe("none");
    expect(r.worstSeverity).toBe("none");
  });

  it("Test 3: bevacizumab is a pharmacodynamic bleeding risk", () => {
    const r = checkDDIs({ rxnormCode: "253337", display: "bevacizumab" });
    expect(r.perDoac.apixaban.severity).toBe("pharmacodynamic");
    expect(r.perDoac.rivaroxaban.severity).toBe("pharmacodynamic");
    expect(r.perDoac.dabigatran.severity).toBe("pharmacodynamic");
    expect(r.perDoac.edoxaban.severity).toBe("pharmacodynamic");
    expect(r.worstSeverity).toBe("pharmacodynamic");
  });

  it("Test 4: enzalutamide (strong inducer) is major for apixaban/rivaroxaban", () => {
    const r = checkDDIs({ rxnormCode: "1307298", display: "enzalutamide" });
    expect(r.perDoac.apixaban.severity).toBe("major");
    expect(r.perDoac.rivaroxaban.severity).toBe("major");
    expect(r.perDoac.dabigatran.severity).toBe("minor");
    expect(r.perDoac.edoxaban.severity).toBe("minor");
    expect(r.worstSeverity).toBe("major");
  });

  it("Test 5: dexamethasone (antiemetic courses) is minor for all DOACs (OpenEvidence review 4)", () => {
    const r = checkDDIs({ rxnormCode: "3264", display: "dexamethasone" });
    expect(r.perDoac.apixaban.severity).toBe("minor");
    expect(r.perDoac.rivaroxaban.severity).toBe("minor");
    expect(r.perDoac.dabigatran.severity).toBe("minor");
    expect(r.perDoac.edoxaban.severity).toBe("minor");
    expect(r.worstSeverity).toBe("minor");
  });

  it("Test 6: unknown RxNorm yields unknown for every DOAC", () => {
    const r = checkDDIs({ rxnormCode: "9999999", display: "unknown" });
    expect(r.perDoac.apixaban.severity).toBe("unknown");
    expect(r.perDoac.rivaroxaban.severity).toBe("unknown");
    expect(r.perDoac.dabigatran.severity).toBe("unknown");
    expect(r.perDoac.edoxaban.severity).toBe("unknown");
    expect(r.worstSeverity).toBe("unknown");
  });
});

describe("special-notes agents (plan Part 3C)", () => {
  it("doxorubicin (3639; P-gp induction in vitro only) is minor for all DOACs", () => {
    const r = checkDDIs({ rxnormCode: "3639", display: "doxorubicin" });
    expect(r.perDoac.apixaban.severity).toBe("minor");
    expect(r.perDoac.rivaroxaban.severity).toBe("minor");
    expect(r.perDoac.dabigatran.severity).toBe("minor");
    expect(r.perDoac.edoxaban.severity).toBe("minor");
    expect(r.worstSeverity).toBe("minor");
  });

  it("vinblastine (11198; P-gp induction in vitro only) is minor for all DOACs", () => {
    const r = checkDDIs({ rxnormCode: "11198", display: "vinblastine" });
    expect(r.worstSeverity).toBe("minor");
    expect(r.perDoac.apixaban.severity).toBe("minor");
  });

  it("etoposide (4179, mild dual inhibitor) is minor for all DOACs", () => {
    const r = checkDDIs({ rxnormCode: "4179", display: "etoposide" });
    expect(r.perDoac.apixaban.severity).toBe("minor");
    expect(r.perDoac.edoxaban.severity).toBe("minor");
    expect(r.worstSeverity).toBe("minor");
  });

  it("tamoxifen (10324, mild P-gp inhibitor) is minor — and is NOT thalidomide/IMiD", () => {
    const r = checkDDIs({ rxnormCode: "10324", display: "tamoxifen" });
    expect(r.medication).toBe("Tamoxifen");
    expect(r.worstSeverity).toBe("minor");
  });
});

describe("getWorstDDIForDoac", () => {
  it("Test 7: aggregates the worst severity per DOAC across medications", () => {
    const results = [
      checkDDIs({ rxnormCode: "12574", display: "gemcitabine" }),
      checkDDIs({ rxnormCode: "28031", display: "itraconazole" }),
    ];
    expect(getWorstDDIForDoac(results, "apixaban")).toBe("major");
    expect(getWorstDDIForDoac(results, "rivaroxaban")).toBe("major");
    expect(getWorstDDIForDoac(results, "dabigatran")).toBe("major");
    expect(getWorstDDIForDoac(results, "edoxaban")).toBe("moderate");
  });

  it("returns none for an empty result set", () => {
    expect(getWorstDDIForDoac([], "apixaban")).toBe("none");
  });
});

describe("worseSeverity ranking", () => {
  it("orders major > moderate > pharmacodynamic > minor > none > unknown", () => {
    expect(worseSeverity("major", "moderate")).toBe("major");
    expect(worseSeverity("moderate", "pharmacodynamic")).toBe("moderate");
    expect(worseSeverity("pharmacodynamic", "minor")).toBe("pharmacodynamic");
    expect(worseSeverity("minor", "none")).toBe("minor");
    expect(worseSeverity("none", "unknown")).toBe("none");
  });
});
