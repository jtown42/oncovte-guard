/**
 * WS-4: alert-governance metrics + override log.
 */
import { describe, it, expect, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync, existsSync } from "node:fs";
import {
  loadSyntheticPatient,
  listSyntheticPatients,
} from "../../src/fhir/standalone-loader";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import { computeAlertMetrics, renderMetricsHtml } from "../../src/cds-hooks/metrics";
import {
  appendOverride,
  readOverrideReasonCounts,
} from "../../src/cds-hooks/override-log";

const NOW = new Date("2026-06-10T12:00:00Z");

function cohort() {
  return listSyntheticPatients().map((_, i) =>
    assemblePatientData(loadSyntheticPatient(i), NOW),
  );
}

describe("computeAlertMetrics", () => {
  it("renders non-zero card counts for all five patients", () => {
    const m = computeAlertMetrics(cohort());
    expect(m.chartOpens).toBe(5);
    expect(m.perPatient).toHaveLength(5);
    for (const p of m.perPatient) {
      expect(p.totalCards, `${p.name} must fire ≥1 card`).toBeGreaterThan(0);
    }
    expect(m.firingRatePer100ChartOpens).toBeGreaterThan(0);
    expect(m.criticalToTotalRatio).toBeGreaterThanOrEqual(0);
    expect(m.criticalToTotalRatio).toBeLessThanOrEqual(1);
  });

  it("incorporates override reason counts into the override rate", () => {
    const m = computeAlertMetrics(cohort(), { data_inaccurate: 2, other: 1 });
    expect(m.totalOverrides).toBe(3);
    expect(m.overrideRate).toBeGreaterThan(0);
    expect(m.overridesByReason.data_inaccurate).toBe(2);
  });

  it("renders a self-contained HTML dashboard", () => {
    const html = renderMetricsHtml(computeAlertMetrics(cohort()));
    expect(html).toMatch(/Alert governance metrics/);
    expect(html).toMatch(/Maria Santos/);
    expect(html).toMatch(/chart-opens/);
  });
});

describe("override log (append-only)", () => {
  const path = join(tmpdir(), `override-test-${Date.now()}.jsonl`);
  afterEach(() => {
    if (existsSync(path)) rmSync(path);
  });

  it("appends overrides and tallies them by reason", () => {
    appendOverride({ reasonCode: "data_inaccurate", patientId: "p1" }, path);
    appendOverride({ reasonCode: "data_inaccurate", patientId: "p2" }, path);
    appendOverride({ reasonCode: "already_addressed" }, path);
    const counts = readOverrideReasonCounts(path);
    expect(counts.data_inaccurate).toBe(2);
    expect(counts.already_addressed).toBe(1);
  });

  it("returns empty counts when the log does not exist", () => {
    expect(readOverrideReasonCounts(join(tmpdir(), "nope-does-not-exist.jsonl"))).toEqual(
      {},
    );
  });
});
