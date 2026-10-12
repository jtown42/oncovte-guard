/**
 * FHIR output layer (F19): the finished recommendation serialized as FHIR R4
 * resources. These tests lock the verdict → resource mapping, the James
 * write-back the talk shows, and the safety posture (draft proposals only).
 */

import { describe, it, expect } from "vitest";
import type {
  Bundle,
  DetectedIssue,
  GuidanceResponse,
  MedicationRequest,
  Provenance,
  Reference,
  RequestGroup,
  RiskAssessment,
} from "fhir/r4";
import { loadSyntheticPatient } from "../../src/fhir/standalone-loader";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { buildFhirOutput, asTransaction, verdictText } from "../../src/fhir-output/build";
import { patientToScenario, scenarioToPatient } from "../../src/standalone/scenario";
import { DDI_KB_VERSION } from "../../src/core/ddi-checker";
import type { PatientData } from "../../src/types/patient";

const NOW = new Date("2026-06-10T12:00:00Z");
const ITRACONAZOLE = "28031";

function load(index: number) {
  return assemblePatientData(loadSyntheticPatient(index), NOW);
}

function output(p: PatientData, source?: PatientData) {
  const rec = generateRecommendation(p);
  return { rec, bundle: buildFhirOutput(p, rec, { now: NOW, source }) };
}

function all<T>(b: Bundle, type: string): T[] {
  return (b.entry ?? []).map((e) => e.resource).filter((r) => r?.resourceType === type) as T[];
}

function counts(b: Bundle): Record<string, number> {
  const c: Record<string, number> = {};
  for (const e of b.entry ?? []) c[e.resource!.resourceType] = (c[e.resource!.resourceType] ?? 0) + 1;
  return c;
}

const refs = (rs: Reference[] | undefined) => (rs ?? []).map((r) => r.reference ?? r.display);

describe("F19: verdict → FHIR resource set", () => {
  it("Maria (recommend): RiskAssessment + 2 draft DOAC proposals in an exactly-one RequestGroup, no issues", () => {
    const { bundle } = output(load(0));
    expect(counts(bundle)).toEqual({
      GuidanceResponse: 1, Device: 1, Provenance: 1, RiskAssessment: 1, MedicationRequest: 2, RequestGroup: 1,
    });
    const meds = all<MedicationRequest>(bundle, "MedicationRequest");
    expect(meds.map((m) => m.dosageInstruction![0].text)).toEqual([
      "Apixaban 2.5 mg PO BID",
      "Rivaroxaban 10 mg PO daily",
    ]);
    expect(meds.map((m) => m.medicationCodeableConcept!.coding![0].code)).toEqual(["1364430", "1114195"]);
    const rg = all<RequestGroup>(bundle, "RequestGroup")[0];
    expect(rg.action![0].selectionBehavior).toBe("exactly-one");
    expect(rg.action![0].action).toHaveLength(2);
  });

  it("James (recommend LMWH): exactly two high-severity interaction issues, both implicating his itraconazole order", () => {
    const { bundle } = output(load(1));
    expect(counts(bundle)).toEqual({
      GuidanceResponse: 1, Device: 1, Provenance: 1, RiskAssessment: 1, DetectedIssue: 2, MedicationRequest: 2, RequestGroup: 1,
    });
    const issues = all<DetectedIssue>(bundle, "DetectedIssue");
    for (const di of issues) {
      expect(di.severity).toBe("high");
      expect(di.code!.coding![0]).toMatchObject({ code: "DRG" });
      expect(refs(di.implicated)).toContain("MedicationRequest/medrx-itraconazole-2");
      expect(di.detail).toMatch(/^Avoid — Itraconazole interaction \(FDA labeling\)/);
      expect(di.mitigation![0].action.text).toBe("Use Enoxaparin or Dalteparin");
    }
    expect(issues.map((d) => d.code!.text)).toEqual([
      "Apixaban: major drug interaction",
      "Rivaroxaban: major drug interaction",
    ]);
    const meds = all<MedicationRequest>(bundle, "MedicationRequest");
    expect(meds.map((m) => m.dosageInstruction![0].text)).toEqual([
      "Enoxaparin 40 mg SC daily",
      "Dalteparin 5,000 units SC daily",
    ]);
    // The fallback proposals cite the cancer as the reason and the issues that forced them as support.
    for (const m of meds) {
      expect(refs(m.reasonReference)).toEqual(["Condition/condition-2"]);
      expect(m.supportingInformation).toHaveLength(3);
    }
  });

  it("James toggle: removing itraconazole drops both issues and the proposals flip to the DOACs", () => {
    const james = load(1);
    const s = patientToScenario(james);
    const off = scenarioToPatient({ ...s, medCodes: s.medCodes.filter((c) => c !== ITRACONAZOLE) });
    const { bundle } = output(off, james);
    expect(all(bundle, "DetectedIssue")).toHaveLength(0);
    expect(all<MedicationRequest>(bundle, "MedicationRequest").map((m) => m.dosageInstruction![0].text)).toEqual([
      "Apixaban 2.5 mg PO BID",
      "Rivaroxaban 10 mg PO daily",
    ]);
    // Adding it back restores the LMWH output exactly.
    const on = scenarioToPatient(s);
    expect(counts(output(on, james).bundle)).toEqual(counts(output(james).bundle));
  });

  it("Dorothy at 42k (contraindicated): one high issue on the platelet Observation, no proposal", () => {
    const { bundle } = output(load(2));
    expect(counts(bundle)).toEqual({ GuidanceResponse: 1, Device: 1, Provenance: 1, RiskAssessment: 1, DetectedIssue: 1 });
    const di = all<DetectedIssue>(bundle, "DetectedIssue")[0];
    expect(di.severity).toBe("high");
    expect(di.code!.coding![0].code).toBe("severe_thrombocytopenia");
    expect(refs(di.implicated)).toEqual(["Observation/obs-platelets-3"]);
  });

  it("Dorothy at 55k (caution): rivaroxaban + both LMWHs blocked for renal function, apixaban proposed with a renal caution", () => {
    const d = load(2);
    const { bundle } = output({ ...d, labs: { ...d.labs, platelets: { ...d.labs.platelets!, value: 55 } } }, d);
    const issues = all<DetectedIssue>(bundle, "DetectedIssue");
    expect(issues.filter((i) => i.severity === "high").map((i) => i.code!.text)).toEqual([
      "Rivaroxaban: avoid at this renal function",
      "Enoxaparin: avoid at this renal function",
      "Dalteparin: avoid at this renal function",
    ]);
    expect(issues.filter((i) => i.severity === "moderate").map((i) => i.code!.text)).toContain(
      "Apixaban: use with caution at this renal function",
    );
    expect(all<MedicationRequest>(bundle, "MedicationRequest").map((m) => m.dosageInstruction![0].text)).toEqual([
      "Apixaban 2.5 mg PO BID",
    ]);
    // The edited platelet value has no source record; creatinine still points at its Observation.
    const renal = issues.find((i) => i.code!.text === "Rivaroxaban: avoid at this renal function")!;
    expect(refs(renal.implicated)).toContain("Observation/obs-creatinine-3");
  });

  it("Robert (not indicated): RiskAssessment only, low tier", () => {
    const { bundle } = output(load(3));
    expect(counts(bundle)).toEqual({ GuidanceResponse: 1, Device: 1, Provenance: 1, RiskAssessment: 1 });
    const ra = all<RiskAssessment>(bundle, "RiskAssessment")[0];
    expect(ra.prediction![0].qualitativeRisk!.coding![0].code).toBe("low");
  });

  it("Priya (excluded): no RiskAssessment (Khorana not applied); the GuidanceResponse names the pathway", () => {
    const { bundle } = output(load(4));
    expect(counts(bundle)).toEqual({ GuidanceResponse: 1, Device: 1, Provenance: 1 });
    const gr = all<GuidanceResponse>(bundle, "GuidanceResponse")[0];
    expect(gr.note!.map((n) => n.text).join(" ")).toMatch(/outside the Khorana model/);
  });
});

describe("F19: provenance and fidelity", () => {
  it("RiskAssessment.basis points at the exact source Condition and lab Observations", () => {
    const ra = all<RiskAssessment>(output(load(1)).bundle, "RiskAssessment")[0];
    expect(refs(ra.basis)).toEqual([
      "Condition/condition-2",
      "Observation/obs-platelets-2",
      "Observation/obs-hemoglobin-2",
      "Observation/obs-wbc-2",
    ]);
    expect(ra.prediction![0].qualitativeRisk!.coding![0].code).toBe("moderate");
  });

  it("qualitativeRisk follows the Khorana tier (0 low, 1–2 moderate, ≥3 high), separate from the ≥2 decision", () => {
    const tier = (i: number) =>
      all<RiskAssessment>(output(load(i)).bundle, "RiskAssessment")[0].prediction![0].qualitativeRisk!.coding![0].code;
    expect([tier(0), tier(1), tier(2), tier(3)]).toEqual(["high", "moderate", "high", "low"]);
  });

  it("the GuidanceResponse carries the dashboard's verdict text; the Provenance covers every generated resource", () => {
    for (let i = 0; i < 5; i++) {
      const { rec, bundle } = output(load(i));
      const gr = all<GuidanceResponse>(bundle, "GuidanceResponse")[0];
      expect(gr.note![0].text).toBe(verdictText(rec));
      const prov = all<Provenance>(bundle, "Provenance")[0];
      const generated = bundle.entry!.filter((e) => !["Device", "Provenance"].includes(e.resource!.resourceType));
      expect(refs(prov.target).sort()).toEqual(generated.map((e) => e.fullUrl).sort());
    }
  });

  it("James's Provenance names the source records the decision read, including the itraconazole order", () => {
    const prov = all<Provenance>(output(load(1)).bundle, "Provenance")[0];
    expect(prov.entity!.map((e) => e.what.reference).sort()).toEqual([
      "Condition/condition-2",
      "MedicationRequest/medrx-itraconazole-2",
      "Observation/obs-hemoglobin-2",
      "Observation/obs-platelets-2",
      "Observation/obs-wbc-2",
    ]);
  });

  it("every internal urn reference resolves to an entry in the bundle", () => {
    for (let i = 0; i < 5; i++) {
      const { bundle } = output(load(i));
      const urls = new Set(bundle.entry!.map((e) => e.fullUrl));
      const json = JSON.stringify(bundle);
      for (const m of json.matchAll(/"reference":"(urn:uuid:[^"]+)"/g)) expect(urls.has(m[1])).toBe(true);
    }
  });

  it("the engine Device carries the knowledge-base version, so the two can't drift", () => {
    const dev = all<{ version: { value: string }[] }>(output(load(0)).bundle, "Device")[0];
    expect(dev.version.map((v) => v.value)).toContain(DDI_KB_VERSION);
  });

  it("is deterministic for the same input and timestamp", () => {
    expect(JSON.stringify(output(load(1)).bundle)).toBe(JSON.stringify(output(load(1)).bundle));
  });
});

describe("F19: safety posture", () => {
  it("no MedicationRequest is ever anything but a draft proposal", () => {
    const james = load(1);
    const d = load(2);
    const variants = [0, 1, 2, 3, 4].map(load).concat([
      { ...d, labs: { ...d.labs, platelets: { ...d.labs.platelets!, value: 55 } } },
      scenarioToPatient({ ...patientToScenario(james), medCodes: [] }),
    ]);
    for (const p of variants) {
      for (const m of all<MedicationRequest>(output(p).bundle, "MedicationRequest")) {
        expect(m.status).toBe("draft");
        expect(m.intent).toBe("proposal");
      }
    }
  });

  it("the transaction form PUTs only the engine Device and POSTs everything else", () => {
    const tx = asTransaction(output(load(1)).bundle);
    expect(tx.type).toBe("transaction");
    for (const e of tx.entry!) {
      if (e.resource!.resourceType === "Device") expect(e.request).toEqual({ method: "PUT", url: "Device/oncovte-guard-engine" });
      else expect(e.request).toEqual({ method: "POST", url: e.resource!.resourceType });
    }
  });
});
