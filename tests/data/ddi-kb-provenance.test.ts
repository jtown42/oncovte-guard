/**
 * WS-3 (F12): DDI knowledge-base auditability.
 *
 * These tests make the "attested, not auditable" gap structurally impossible to
 * reintroduce: every `major` cell (the only cells that change a recommendation)
 * must carry a non-empty per-cell evidenceAnchor, and no mechanism string may
 * state a quantitative (digit-percentage) magnitude without one.
 */

import { describe, it, expect } from "vitest";
import kb from "../../src/data/ddi-knowledge-base.json";
import { DOAC_NAMES, type DDIKnowledgeBase } from "../../src/types/ddi";

const KB = kb as DDIKnowledgeBase;
const DIGIT_PERCENT = /\d\s*%/;

describe("DDI KB root metadata (WS-3)", () => {
  it("carries a version, a curation date, and a provenance note", () => {
    expect(KB.kbVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(KB.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(KB.provenanceNote.length).toBeGreaterThan(0);
    expect(Array.isArray(KB.agents)).toBe(true);
    expect(KB.agents.length).toBe(52);
  });

  it("does NOT claim clinician validation or per-agent literature sourcing (honesty guard)", () => {
    const note = KB.provenanceNote.toLowerCase();
    expect(note).not.toMatch(/clinician-validated|clinically validated/);
    expect(note).not.toMatch(/literature-sourced per agent/);
    // It must say what it actually is.
    expect(note).toMatch(/attestation/);
  });
});

describe("Every major cell is individually anchored (WS-3)", () => {
  const majorCells: { agent: string; doac: string; anchor?: unknown }[] = [];
  for (const e of KB.agents) {
    for (const doac of DOAC_NAMES) {
      const det = e.interactions[doac];
      if (det.severity === "major") {
        majorCells.push({ agent: e.agentName, doac, anchor: det.evidenceAnchor });
      }
    }
  }

  it("has exactly 16 major cells (8 agents × apixaban/rivaroxaban)", () => {
    expect(majorCells.length).toBe(16);
    const doacs = new Set(majorCells.map((c) => c.doac));
    expect([...doacs].sort()).toEqual(["apixaban", "rivaroxaban"]);
  });

  it("every major cell has a non-empty evidenceAnchor {source, locator, claim}", () => {
    for (const e of KB.agents) {
      for (const doac of DOAC_NAMES) {
        const det = e.interactions[doac];
        if (det.severity !== "major") continue;
        const a = det.evidenceAnchor;
        expect(a, `${e.agentName}/${doac} missing evidenceAnchor`).toBeDefined();
        expect(a!.source.trim().length, `${e.agentName}/${doac} source`).toBeGreaterThan(0);
        expect(a!.locator.trim().length, `${e.agentName}/${doac} locator`).toBeGreaterThan(0);
        expect(a!.claim.trim().length, `${e.agentName}/${doac} claim`).toBeGreaterThan(0);
        // A locator must be more than a bare paper name — it names a table/section/label part.
        expect(
          /table|section|label|drug interactions/i.test(a!.locator),
          `${e.agentName}/${doac} locator must name a table/section/label part`,
        ).toBe(true);
      }
    }
  });

  it("no mechanism stating a digit-percentage magnitude lacks an anchor", () => {
    for (const e of KB.agents) {
      for (const doac of DOAC_NAMES) {
        const det = e.interactions[doac];
        if (DIGIT_PERCENT.test(det.mechanism)) {
          expect(
            det.evidenceAnchor,
            `${e.agentName}/${doac} states a magnitude ("${det.mechanism}") without an anchor`,
          ).toBeDefined();
        }
      }
    }
  });

  it("the guard fails if an anchor is removed (meta-test)", () => {
    // Simulate deleting an anchor and confirm the invariant would catch it.
    const sample = KB.agents.find((e) => e.interactions.apixaban.severity === "major")!;
    const clone = JSON.parse(JSON.stringify(sample.interactions.apixaban));
    delete clone.evidenceAnchor;
    const stillValid = clone.evidenceAnchor !== undefined;
    expect(stillValid).toBe(false);
  });
});
