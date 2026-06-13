/**
 * CDS Hooks card-builder tests. Drives the synthetic patients through the
 * prefetch adapter + card builders, asserting the indicators and interaction
 * cards an EHR would render.
 */
import { describe, it, expect } from "vitest";
import { loadSyntheticPatient } from "../../src/fhir/standalone-loader";
import { prefetchToRawFHIRData } from "../../src/cds-hooks/prefetch";
import { assemblePatientData } from "../../src/fhir/fhir-parser";
import {
  buildPatientViewCards,
  buildOrderSelectCards,
} from "../../src/cds-hooks/cards";
import { extractOrderedMeds } from "../../src/cds-hooks/server";
import { DISCOVERY } from "../../src/cds-hooks/discovery";
import { RXNORM } from "../../src/data/rxnorm-codes";
import type { Bundle } from "fhir/r4";

const NOW = new Date("2026-06-10T12:00:00Z");

/** Reconstruct a CDS Hooks prefetch object from a synthetic bundle. */
function prefetchFor(index: number): Record<string, unknown> {
  const raw = loadSyntheticPatient(index);
  return {
    patient: raw.patient,
    conditions: raw.conditions,
    labs: raw.labs,
    vitals: raw.vitals,
    medications: raw.medications,
  };
}

function patient(index: number) {
  return assemblePatientData(prefetchToRawFHIRData(prefetchFor(index)), NOW);
}

describe("discovery document", () => {
  it("advertises a patient-view and an order-select service", () => {
    const ids = DISCOVERY.services.map((s) => s.id);
    expect(ids).toContain("oncovte-prophylaxis");
    expect(ids).toContain("oncovte-ddi-check");
    expect(DISCOVERY.services.find((s) => s.id === "oncovte-prophylaxis")?.hook).toBe(
      "patient-view",
    );
    expect(DISCOVERY.services.find((s) => s.id === "oncovte-ddi-check")?.hook).toBe(
      "order-select",
    );
    // every service declares prefetch templates including the Patient
    for (const s of DISCOVERY.services) {
      expect(s.prefetch?.patient).toBe("Patient/{{context.patientId}}");
    }
  });
});

describe("prefetch adapter", () => {
  it("throws when the Patient resource is absent", () => {
    expect(() => prefetchToRawFHIRData({})).toThrow(/Patient/);
  });
  it("degrades missing search bundles to empty bundles", () => {
    const raw = loadSyntheticPatient(0);
    const out = prefetchToRawFHIRData({ patient: raw.patient });
    expect(out.conditions.entry).toEqual([]);
    expect(out.medications.entry).toEqual([]);
  });
});

describe("patient-view cards", () => {
  it("Maria (recommend): info summary, no critical cards, names a DOAC", () => {
    const cards = buildPatientViewCards(patient(0));
    expect(cards[0].indicator).toBe("info");
    expect(cards[0].summary).toMatch(/recommend/i);
    expect(cards[0].detail).toMatch(/apixaban/);
    expect(cards.some((c) => c.indicator === "critical")).toBe(false);
    // every card honors the 140-char summary cap
    for (const c of cards) expect(c.summary.length).toBeLessThanOrEqual(140);
  });

  it("James (major ibrutinib DDI): emits a critical interaction card", () => {
    const cards = buildPatientViewCards(patient(1));
    expect(cards.some((c) => c.indicator === "critical")).toBe(true);
    expect(
      cards.some((c) => /ibrutinib/i.test(c.summary) || /ibrutinib/i.test(c.detail ?? "")),
    ).toBe(true);
  });

  it("Dorothy (contraindicated): summary card is critical", () => {
    const cards = buildPatientViewCards(patient(2));
    expect(cards[0].indicator).toBe("critical");
    expect(cards[0].summary).toMatch(/contraindicated/i);
  });

  it("Priya (excluded): info summary noting the disease-specific pathway", () => {
    const cards = buildPatientViewCards(patient(4));
    expect(cards[0].indicator).toBe("info");
    expect(cards[0].summary).toMatch(/not applicable|disease-specific/i);
  });
});

describe("order-select cards", () => {
  it("ordering apixaban for a patient on ibrutinib flags a critical interaction", () => {
    const cards = buildOrderSelectCards(patient(1), [
      { rxnormCode: RXNORM.APIXABAN, display: "apixaban" },
    ]);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some((c) => c.indicator === "critical")).toBe(true);
    expect(cards[0].summary.toLowerCase()).toContain("apixaban");
  });

  it("ordering apixaban for a clean patient produces no interaction cards", () => {
    // Maria's active chemo (gemcitabine none, nab-paclitaxel minor) is not surfaced.
    const cards = buildOrderSelectCards(patient(0), [
      { rxnormCode: RXNORM.APIXABAN, display: "apixaban" },
    ]);
    expect(cards).toHaveLength(0);
  });
});

describe("extractOrderedMeds", () => {
  it("pulls RxNorm-coded MedicationRequests out of a draftOrders bundle", () => {
    const draftOrders: Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "MedicationRequest",
            status: "draft",
            intent: "order",
            subject: { reference: "Patient/x" },
            medicationCodeableConcept: {
              coding: [
                {
                  system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                  code: RXNORM.RIVAROXABAN,
                  display: "rivaroxaban",
                },
              ],
            },
          },
        },
      ],
    };
    const meds = extractOrderedMeds(draftOrders);
    expect(meds).toEqual([
      { rxnormCode: RXNORM.RIVAROXABAN, display: "rivaroxaban" },
    ]);
  });

  it("returns [] for a non-bundle context", () => {
    expect(extractOrderedMeds(undefined)).toEqual([]);
    expect(extractOrderedMeds({ resourceType: "Patient" })).toEqual([]);
  });
});
