/**
 * Panel screening (F20): the unchanged engine run across a Bulk Data-style
 * NDJSON export. Locks the worklist rule and that every row is exactly what
 * the single-patient engine says for that patient.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import type { FhirResource } from "fhir/r4";
import { screenPanel } from "../../src/panel/screen";
import { loadSyntheticPatient } from "../../src/fhir/standalone-loader";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import { generateRecommendation } from "../../src/core/recommendation";
import { verdictText } from "../../src/fhir-output/build";

const NOW = new Date("2026-10-11T12:00:00Z");
const PANEL = path.join(__dirname, "..", "..", "synthetic-panel");

function readPanel(): FhirResource[] {
  return fs
    .readdirSync(PANEL)
    .filter((f) => f.endsWith(".ndjson"))
    .flatMap((f) => fs.readFileSync(path.join(PANEL, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
}

/** The five demo patients flattened to the shape a $export produces. */
function demoAsNdjson(): FhirResource[] {
  const out: FhirResource[] = [];
  for (let i = 0; i < 5; i++) {
    const raw = loadSyntheticPatient(i);
    out.push(raw.patient);
    for (const b of [raw.conditions, raw.labs, raw.vitals, raw.medications]) {
      for (const e of b.entry ?? []) out.push(e.resource!);
    }
  }
  return out;
}

describe("F20: panel screening over Bulk Data NDJSON", () => {
  it("the five demo patients screened as a panel get the same verdicts as one at a time", () => {
    const result = screenPanel(demoAsNdjson(), NOW);
    expect(result.screened).toBe(5);
    for (let i = 0; i < 5; i++) {
      const p = assemblePatientData(loadSyntheticPatient(i), NOW);
      const row = result.rows.find((r) => r.id === p.id)!;
      expect(row.verdict).toBe(verdictText(generateRecommendation(p)));
    }
  });

  it("flags only patients who meet the threshold with an eligible agent and have no active anticoagulant", () => {
    const result = screenPanel(demoAsNdjson(), NOW);
    const flagged = result.rows.filter((r) => r.flagged).map((r) => r.patient).sort();
    // Maria (recommend) and James (LMWH) are flagged; Dorothy (contraindicated),
    // Robert (not indicated) and Priya (excluded) are not.
    expect(flagged).toEqual(["James Chen", "Maria Santos"]);
  });

  it("never flags a patient who already has an active anticoagulant order", () => {
    const result = screenPanel(readPanel(), NOW);
    expect(result.rows.filter((r) => r.onAnticoagulant && r.flagged)).toHaveLength(0);
    expect(result.rows.some((r) => r.onAnticoagulant)).toBe(true);
  });

  it("a patient whose cancer is coded only in SNOMED is screened but not assessed (ICD-10-CM only, a known limit)", () => {
    const resources = demoAsNdjson().map((r) =>
      r.resourceType === "Condition" && (r as any).subject.reference === "Patient/patient-1"
        ? { ...r, code: { coding: [{ system: "http://snomed.info/sct", code: "363418001", display: "Malignant tumor of pancreas" }] } }
        : r,
    ) as FhirResource[];
    const result = screenPanel(resources, NOW);
    expect(result.screened).toBe(5);
    expect(result.rows.find((r) => r.id === "patient-1")).toBeUndefined();
  });

  it("the synthetic panel screens every patient and is reproducible", () => {
    const a = screenPanel(readPanel(), NOW);
    const b = screenPanel(readPanel(), NOW);
    expect(a.screened).toBe(40);
    expect(a.withCancer).toBe(40);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
