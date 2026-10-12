/**
 * FHIR output layer: serializes a finished recommendation as standard FHIR R4
 * resources so the reasoning is machine-readable, not only on screen.
 *
 * This is a pure serializer. It reads the ProphylaxisRecommendation that
 * generateRecommendation() already produced and maps it onto FHIR. It never
 * computes, re-orders, or alters a clinical decision, and nothing here is
 * written to a chart: proposed orders are status=draft, intent=proposal.
 *
 *   GuidanceResponse  the verdict (one per run); result → the RequestGroup
 *   RiskAssessment    Khorana score + tier; basis → the source Observations/Condition
 *   DetectedIssue     one per blocked agent, universal contraindication, or caution
 *   RequestGroup      the equivalent options, selectionBehavior = exactly-one
 *   MedicationRequest one draft proposal per option (RxNorm, the exact UI dose)
 *   Device            the engine itself (app + knowledge-base version)
 *   Provenance        ties every generated resource to the engine and to the
 *                     source Conditions/Observations/MedicationRequests it read
 *
 * R4 reference rules shape the links: GuidanceResponse.reasonReference and
 * MedicationRequest.reasonReference may only point at clinical findings
 * (Condition/Observation), so the proposals cite the cancer Condition as the
 * reason and the RiskAssessment/DetectedIssues as supportingInformation, and
 * the Provenance (whose target may be any resource) records the whole run.
 */

import type {
  Bundle,
  BundleEntry,
  DetectedIssue,
  Device,
  FhirResource,
  GuidanceResponse,
  MedicationRequest,
  Narrative,
  Provenance,
  Reference,
  RequestGroup,
  RiskAssessment,
} from "fhir/r4";

import type { PatientData } from "../types/patient";
import type { DOACOption, ProphylaxisRecommendation } from "../types/recommendation";
import type { DoacName } from "../types/ddi";
import { RiskCategory } from "../types/khorana";
import { RXNORM } from "../data/rxnorm-codes";
import { DDI_KB_VERSION } from "../core/ddi-checker";
import { ACTION } from "../ui/format";
import pkg from "../../package.json";

export const ENGINE_DEVICE_ID = "oncovte-guard-engine";
export const MODULE_URI = "https://oncovte-guard.pages.dev/fhir/modules/vte-prophylaxis";
/** Local code system for findings that have no good standard code (text is primary). */
export const LOCAL_ISSUE_SYSTEM = "https://oncovte-guard.pages.dev/fhir/CodeSystem/finding";

const RXNORM_SYSTEM = "http://www.nlm.nih.gov/research/umls/rxnorm";
const RISK_PROBABILITY = "http://terminology.hl7.org/CodeSystem/risk-probability";
const ACT_CODE = "http://terminology.hl7.org/CodeSystem/v3-ActCode";

const ANTICOAGULANT_RXNORM: Record<string, string> = {
  apixaban: RXNORM.APIXABAN,
  rivaroxaban: RXNORM.RIVAROXABAN,
  enoxaparin: RXNORM.ENOXAPARIN,
  dalteparin: RXNORM.DALTEPARIN,
};

/** Agents that are actual prophylaxis options (dabigatran/edoxaban are reference-only). */
const PROPHYLAXIS_AGENTS = new Set(Object.keys(ANTICOAGULANT_RXNORM));

const QUALITATIVE: Record<RiskCategory, { code: string; display: string }> = {
  [RiskCategory.LOW]: { code: "low", display: "Low likelihood" },
  [RiskCategory.INTERMEDIATE]: { code: "moderate", display: "Moderate likelihood" },
  [RiskCategory.HIGH]: { code: "high", display: "High likelihood" },
};

export interface FhirOutputOptions {
  /** Run timestamp (defaults to now); fixed in tests for determinism. */
  now?: Date;
  /**
   * The patient as parsed from FHIR, before any what-if edits. Used only to
   * point references at real source resources. A drug or lab added or changed
   * in the editor has no source resource and gets a display-only reference.
   */
  source?: PatientData;
}

/* ---------- small helpers ---------- */

/** Deterministic RFC-4122-shaped UUID from a seed (cyrb128), so output is stable. */
export function stableUuid(seed: string): string {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  const hex = [h1 ^ h2 ^ h3 ^ h4, h2 ^ h1, h3 ^ h1, h4 ^ h1]
    .map((n) => (n >>> 0).toString(16).padStart(8, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "4" + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Generated XHTML narrative (dom-6): the human-readable summary of a resource. */
function narrative(text: string): Narrative {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${esc}</p></div>` };
}

/** "Apixaban 2.5 mg PO BID" — the exact regimen string the dashboard shows. */
export function regimenText(o: DOACOption): string {
  return [cap(o.name), o.dose, o.route, o.frequency].filter(Boolean).join(" ");
}

/** The verdict sentence, built from the same labels the dashboard hero uses. */
export function verdictText(rec: ProphylaxisRecommendation): string {
  const head =
    rec.verdictLabel === "recommend_lmwh"
      ? "Prophylaxis recommended — LMWH"
      : ACTION[rec.overallAction].label;
  const regimen = rec.preferredOptions.length ? rec.preferredOptions : rec.alternativeOptions;
  const showOptions = rec.overallAction === "recommend" || rec.overallAction === "caution";
  return showOptions && regimen.length
    ? `${head}: ${regimen.map(regimenText).join(" or ")}`
    : head;
}

/* ---------- reference resolution (provenance only) ---------- */

interface RefIndex {
  patient: Reference;
  med(rxnorm: string, display: string): Reference;
  lab(field: keyof PatientData["labs"], value: number | undefined, label: string): Reference | null;
  condition(code: string, display: string): Reference;
}

function buildRefIndex(patient: PatientData, source?: PatientData): RefIndex {
  const src = source ?? patient;
  const patientId = patient.id === "scenario" && source ? source.id : patient.id;
  return {
    patient: { reference: `Patient/${patientId}`, display: patient.name },
    med(rxnorm, display) {
      const hit = src.activeMedications.find((m) => m.rxnormCode === rxnorm && m.sourceRef);
      return hit
        ? { reference: hit.sourceRef, display }
        : { display: `${display} (not from a source record)` };
    },
    lab(field, value, label) {
      if (value == null) return null;
      const s = src.labs[field];
      return s?.sourceRef && s.value === value
        ? { reference: s.sourceRef, display: `${label} ${value} ${s.unit}`.trim() }
        : { display: `${label} ${value} (not from a source record)` };
    },
    condition(code, display) {
      const hit = src.activeCancerConditions.find((c) => c.code === code && c.sourceRef);
      return hit
        ? { reference: hit.sourceRef, display }
        : { display: `${display} (not from a source record)` };
    },
  };
}

/* ---------- builder ---------- */

interface Built {
  entries: { resource: FhirResource; fullUrl: string }[];
}

/**
 * Serialize one recommendation as a FHIR `collection` Bundle. Pure and
 * deterministic for a given (patient, recommendation, now).
 */
export function buildFhirOutput(
  patient: PatientData,
  rec: ProphylaxisRecommendation,
  opts: FhirOutputOptions = {},
): Bundle {
  const now = (opts.now ?? new Date()).toISOString();
  const refs = buildRefIndex(patient, opts.source);
  const seed = `${refs.patient.reference}|${now}|${verdictText(rec)}`;
  const urn = (kind: string) => `urn:uuid:${stableUuid(`${seed}|${kind}`)}`;
  const out: Built = { entries: [] };
  const add = <T extends FhirResource>(fullUrl: string, resource: T): Reference => {
    out.entries.push({ fullUrl, resource });
    return { reference: fullUrl };
  };

  // Device: the engine. Referenced by urn inside the bundle; a transaction PUTs
  // it to Device/oncovte-guard-engine and the server rewrites the references.
  const deviceUrn = urn("device");
  const deviceRef: Reference = { reference: deviceUrn, display: "OncoVTE Guard Decision Engine" };
  const device: Device = {
    resourceType: "Device",
    id: ENGINE_DEVICE_ID,
    text: narrative(`OncoVTE Guard Decision Engine, version ${pkg.version}, knowledge base ${DDI_KB_VERSION}.`),
    status: "active",
    deviceName: [{ name: "OncoVTE Guard Decision Engine", type: "user-friendly-name" }],
    version: [
      { type: { text: "software" }, value: pkg.version },
      { type: { text: "DOAC interaction knowledge base" }, value: DDI_KB_VERSION },
    ],
  };
  out.entries.push({ fullUrl: deviceUrn, resource: device });

  /** Real source resources the run read (for Provenance.entity). */
  const sources = new Map<string, Reference>();
  const noteSources = (rs: Reference[]) => {
    for (const r of rs) if (r.reference) sources.set(r.reference, r);
  };

  // RiskAssessment: every pathway except Excluded (Khorana not applied).
  let riskRef: Reference | null = null;
  if (rec.overallAction !== "excluded") {
    const k = rec.khorana;
    const b = k.breakdown;
    const fired: string[] = [];
    if (b.cancerSite.score) fired.push(`${b.cancerSite.value} (+${b.cancerSite.score})`);
    if (b.platelets.score) fired.push(`platelets ≥350 ×10⁹/L (+1)`);
    if (b.hemoglobin.score) fired.push(b.hemoglobin.esaFlag ? "ESA use (+1)" : "hemoglobin <10 g/dL (+1)");
    if (b.wbc.score) fired.push("WBC >11 ×10⁹/L (+1)");
    if (b.bmi.score) fired.push("BMI ≥35 (+1)");
    const rationale = `${fired.length ? fired.join("; ") : "No criteria met"}; total ${k.totalScore}. Prophylaxis threshold is ≥2.`;

    const basis: Reference[] = [];
    for (const c of patient.activeCancerConditions) basis.push(refs.condition(c.code, c.display));
    const pl = refs.lab("platelets", patient.labs.platelets?.value, "Platelets");
    const hb = refs.lab("hemoglobin", patient.labs.hemoglobin?.value, "Hemoglobin");
    const wbc = refs.lab("wbc", patient.labs.wbc?.value, "WBC");
    for (const r of [pl, hb, wbc]) if (r) basis.push(r);

    noteSources(basis);
    const ra: RiskAssessment = {
      resourceType: "RiskAssessment",
      text: narrative(`Khorana ${k.totalScore} (${k.riskCategory}). ${rationale}`),
      status: "final",
      subject: refs.patient,
      occurrenceDateTime: now,
      performer: deviceRef,
      code: { text: "Risk of cancer-associated venous thromboembolism" },
      method: { text: "Khorana score" },
      basis,
      prediction: [
        {
          outcome: { text: "Venous thromboembolism" },
          qualitativeRisk: {
            coding: [{ system: RISK_PROBABILITY, ...QUALITATIVE[k.riskCategory] }],
            text: `Khorana ${k.totalScore} (${k.riskCategory})`,
          },
          rationale,
        },
      ],
      note: [{ text: "Khorana AA et al., Blood 2008; tiers per NCCN VTE-C. Tier informs the ≥2 decision; it is not an individual risk estimate." }],
    };
    riskRef = add(urn("risk"), ra);
  }

  // DetectedIssues.
  const issue = (
    kind: string,
    severity: DetectedIssue["severity"],
    code: DetectedIssue["code"],
    detail: string,
    implicated: Reference[],
    mitigation: string | null,
  ): Reference => {
    noteSources(implicated);
    const di: DetectedIssue = {
      resourceType: "DetectedIssue",
      text: narrative(`${code?.text}. ${detail}${mitigation ? ` Mitigation: ${mitigation}.` : ""}`),
      status: "final",
      code,
      severity,
      patient: refs.patient,
      identifiedDateTime: now,
      author: deviceRef,
      ...(implicated.length ? { implicated } : {}),
      detail,
      ...(mitigation
        ? { mitigation: [{ action: { text: mitigation }, date: now }] }
        : {}),
    };
    return add(urn(`issue|${kind}`), di);
  };

  const regimen = rec.preferredOptions.length ? rec.preferredOptions : rec.alternativeOptions;
  const mitigationFor = (blocked: DOACOption): string | null => {
    if (!regimen.length) return "No eligible anticoagulant; clinician review required";
    const names = regimen.map((o) => cap(o.name)).join(" or ");
    return regimen.some((o) => o.name === blocked.name) ? null : `Use ${names}`;
  };

  const forcing: Reference[] = [];

  if (rec.overallAction === "contraindicated") {
    rec.contraindications.absolute
      .filter((c) => c.appliesTo === "all")
      .forEach((c) => {
        const implicated: Reference[] = [];
        if (c.reason === "severe_thrombocytopenia") {
          const pl = refs.lab("platelets", patient.labs.platelets?.value, "Platelets");
          if (pl) implicated.push(pl);
        }
        issue(
          `contra|${c.reason}`,
          "high",
          { coding: [{ system: LOCAL_ISSUE_SYSTEM, code: c.reason }], text: "Absolute contraindication to anticoagulation" },
          c.detail,
          implicated,
          "Do not start pharmacologic prophylaxis; reassess",
        );
      });
  }

  // One issue per blocked prophylaxis agent, classified by the engine's own reason.
  for (const o of rec.avoidOptions) {
    if (!PROPHYLAXIS_AGENTS.has(o.name) || !o.ineligibleReason) continue;
    const targeted = rec.contraindications.absolute.find(
      (c) => Array.isArray(c.appliesTo) && c.appliesTo.includes(o.name as never) && c.detail === o.ineligibleReason,
    );
    let r: Reference;
    if (o.worstDDI === "major" && o.ineligibleReason.startsWith("Avoid —")) {
      const offenders = rec.ddiResults.filter((d) => d.perDoac[o.name as DoacName]?.severity === "major");
      r = issue(
        `ddi|${o.name}`,
        "high",
        { coding: [{ system: ACT_CODE, code: "DRG", display: "Drug Interaction Alert" }], text: `${cap(o.name)}: major drug interaction` },
        o.ineligibleReason,
        [
          { display: `${cap(o.name)} (candidate prophylaxis agent)` },
          ...offenders.map((d) => refs.med(d.rxnormCode, d.medication)),
        ],
        mitigationFor(o),
      );
    } else if (targeted) {
      r = issue(
        `contra|${o.name}`,
        "high",
        { coding: [{ system: LOCAL_ISSUE_SYSTEM, code: targeted.reason }], text: `${cap(o.name)}: contraindicated` },
        o.ineligibleReason,
        [{ display: `${cap(o.name)} (candidate prophylaxis agent)` }],
        mitigationFor(o),
      );
    } else {
      const cr = refs.lab("serumCreatinine", patient.labs.serumCreatinine?.value, "Serum creatinine");
      r = issue(
        `renal|${o.name}`,
        "high",
        { coding: [{ system: LOCAL_ISSUE_SYSTEM, code: "renal_avoid" }], text: `${cap(o.name)}: avoid at this renal function` },
        o.ineligibleReason,
        [{ display: `${cap(o.name)} (candidate prophylaxis agent)` }, ...(cr ? [cr] : [])],
        mitigationFor(o),
      );
    }
    forcing.push(r);
  }

  // Cautions on the options that remain (renal caution, moderate interaction).
  for (const o of regimen) {
    if (o.renalStatus === "caution") {
      const cr = refs.lab("serumCreatinine", patient.labs.serumCreatinine?.value, "Serum creatinine");
      issue(
        `renal-caution|${o.name}`,
        "moderate",
        { coding: [{ system: LOCAL_ISSUE_SYSTEM, code: "renal_caution" }], text: `${cap(o.name)}: use with caution at this renal function` },
        rec.renal?.doacRecommendations.find((d) => d.doac === o.name)?.rationale ?? "Renal function warrants caution.",
        [{ display: `${cap(o.name)} (proposed)` }, ...(cr ? [cr] : [])],
        null,
      );
    }
    if (o.worstDDI === "moderate") {
      const offenders = rec.ddiResults.filter((d) => d.perDoac[o.name as DoacName]?.severity === "moderate");
      issue(
        `ddi-moderate|${o.name}`,
        "moderate",
        { coding: [{ system: ACT_CODE, code: "DRG", display: "Drug Interaction Alert" }], text: `${cap(o.name)}: moderate drug interaction` },
        offenders.map((d) => `${d.medication}: ${d.perDoac[o.name as DoacName].mechanism}`).join(" "),
        [{ display: `${cap(o.name)} (proposed)` }, ...offenders.map((d) => refs.med(d.rxnormCode, d.medication))],
        null,
      );
    }
  }
  if (regimen.length) {
    for (const c of rec.contraindications.relative) {
      issue(
        `relative|${c.reason}`,
        "moderate",
        { coding: [{ system: LOCAL_ISSUE_SYSTEM, code: c.reason }], text: "Relative contraindication (caution)" },
        c.detail,
        [],
        null,
      );
    }
  }

  // RequestGroup + draft MedicationRequest proposals (recommend paths only).
  let resultRef: Reference | null = null;
  const proposes =
    (rec.overallAction === "recommend" || rec.overallAction === "caution") && regimen.length > 0;
  if (proposes) {
    const cancerRefs = patient.activeCancerConditions.map((c) => refs.condition(c.code, c.display));
    const actions: NonNullable<RequestGroup["action"]> = regimen.map((o) => {
      const mr: MedicationRequest = {
        resourceType: "MedicationRequest",
        text: narrative(`Draft proposal, not an order: ${regimenText(o)}.`),
        status: "draft",
        intent: "proposal",
        subject: refs.patient,
        authoredOn: now,
        requester: deviceRef,
        medicationCodeableConcept: {
          coding: [{ system: RXNORM_SYSTEM, code: ANTICOAGULANT_RXNORM[o.name], display: o.name }],
          text: cap(o.name),
        },
        dosageInstruction: [{ text: regimenText(o) }],
        reasonReference: cancerRefs,
        supportingInformation: [
          ...(riskRef ? [riskRef] : []),
          ...(rec.verdictLabel === "recommend_lmwh" ? forcing : []),
        ],
        note: [{ text: `Source: ${o.source ?? "NCCN VTE-B"}. ${o.duration}.` }],
      };
      const r = add(urn(`proposal|${o.name}`), mr);
      return { title: regimenText(o), resource: r };
    });
    const rg: RequestGroup = {
      resourceType: "RequestGroup",
      text: narrative(`Choose one: ${regimen.map(regimenText).join(" or ")}.`),
      status: "draft",
      intent: "proposal",
      subject: refs.patient,
      authoredOn: now,
      author: deviceRef,
      action: [
        {
          title: "Prophylactic anticoagulant (choose one)",
          selectionBehavior: "exactly-one",
          action: actions,
        },
      ],
    };
    resultRef = add(urn("requestgroup"), rg);
  }

  // GuidanceResponse: the verdict envelope, first in the bundle.
  const gr: GuidanceResponse = {
    resourceType: "GuidanceResponse",
    text: narrative(verdictText(rec)),
    moduleUri: MODULE_URI,
    status: "success",
    subject: refs.patient,
    occurrenceDateTime: now,
    performer: deviceRef,
    note: [
      { text: verdictText(rec) },
      ...(rec.overallAction === "excluded"
        ? [{ text: "Cancer type is outside the Khorana model; follow the disease-specific pathway." }]
        : []),
    ],
    ...(resultRef ? { result: resultRef } : {}),
  };
  const grEntry = { fullUrl: urn("guidance"), resource: gr as FhirResource };

  // Provenance: every generated resource ← the engine ← the source records it read.
  const generated = [grEntry, ...out.entries].filter((e) => e.resource.resourceType !== "Device");
  const prov: Provenance = {
    resourceType: "Provenance",
    text: narrative(
      `Generated by OncoVTE Guard Decision Engine ${pkg.version} (knowledge base ${DDI_KB_VERSION}) from ${sources.size} source record(s).`,
    ),
    target: generated.map((e) => ({ reference: e.fullUrl })),
    recorded: now,
    agent: [
      {
        type: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "author", display: "Author" }],
        },
        who: deviceRef,
      },
    ],
    ...(sources.size
      ? { entity: [...sources.values()].map((what) => ({ role: "source" as const, what })) }
      : {}),
  };
  const provEntry = { fullUrl: urn("provenance"), resource: prov as FhirResource };

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: now,
    entry: [grEntry, ...out.entries, provEntry] as BundleEntry[],
  };
}

/**
 * The same output as a FHIR `transaction` for a sandbox round trip: the engine
 * Device is PUT (idempotent); every generated resource is POSTed, and the server
 * rewrites the urn:uuid references. Never sent to a live chart.
 */
export function asTransaction(collection: Bundle): Bundle {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: (collection.entry ?? []).map((e) => {
      const r = e.resource!;
      return r.resourceType === "Device"
        ? { fullUrl: e.fullUrl, resource: r, request: { method: "PUT" as const, url: `Device/${r.id}` } }
        : { fullUrl: e.fullUrl, resource: r, request: { method: "POST" as const, url: r.resourceType } };
    }),
  };
}
