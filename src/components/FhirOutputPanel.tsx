/**
 * F19: the decision as standard FHIR. Shows the resources the FHIR output layer
 * builds from the recommendation above (nothing is written to a chart here):
 * a one-line summary per resource, plus the full Bundle JSON to copy or save.
 */
import { useMemo, useState } from "react";
import type { Bundle, DetectedIssue, MedicationRequest, RiskAssessment } from "fhir/r4";
import type { PatientData } from "../types/patient";
import type { ProphylaxisRecommendation } from "../types/recommendation";
import { buildFhirOutput } from "../fhir-output/build";

function summary(r: NonNullable<Bundle["entry"]>[number]["resource"]): string {
  switch (r?.resourceType) {
    case "GuidanceResponse":
      return r.note?.[0]?.text ?? "";
    case "RiskAssessment": {
      const ra = r as RiskAssessment;
      return `${ra.prediction?.[0]?.qualitativeRisk?.text} · basis: ${ra.basis?.length ?? 0} source records`;
    }
    case "DetectedIssue": {
      const di = r as DetectedIssue;
      const who = di.implicated?.map((i) => i.reference ?? i.display).filter((x) => x && !x.includes("candidate")).join(", ");
      return `${di.severity} · ${di.code?.text}${who ? ` · implicates ${who}` : ""}`;
    }
    case "MedicationRequest": {
      const mr = r as MedicationRequest;
      return `${mr.status} ${mr.intent} · ${mr.dosageInstruction?.[0]?.text} · RxNorm ${mr.medicationCodeableConcept?.coding?.[0]?.code}`;
    }
    case "RequestGroup":
      return "choose exactly one of the proposals";
    case "Device":
      return "the decision engine (app + knowledge-base version)";
    case "Provenance":
      return `links every resource above to the engine and ${r.entity?.length ?? 0} source records`;
    default:
      return "";
  }
}

export function FhirOutputPanel({
  patient,
  rec,
  source,
}: {
  patient: PatientData;
  rec: ProphylaxisRecommendation;
  source?: PatientData;
}) {
  const bundle = useMemo(() => buildFhirOutput(patient, rec, { source }), [patient, rec, source]);
  const json = useMemo(() => JSON.stringify(bundle, null, 2), [bundle]);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShowJson(true);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/fhir+json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `oncovte-guard-output-${patient.name.toLowerCase().replace(/[^a-z]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <details className="card overflow-hidden">
      <summary className="cursor-pointer px-5 py-4">
        <span className="text-base font-semibold text-clinical-ink">FHIR output</span>
        <span className="ml-2 text-sm text-clinical-muted">
          the decision above as standard FHIR R4 resources · {bundle.entry?.length ?? 0} resources
        </span>
      </summary>
      <div className="border-t border-clinical-hairline px-5 pb-5 pt-3">
        <p className="mb-3 max-w-[75ch] text-sm text-clinical-inkSoft">
          Structured FHIR in, structured FHIR out. Built from the engine's finished decision; nothing
          is written to the chart. Proposed orders are <span className="font-mono">draft</span>{" "}
          <span className="font-mono">proposal</span> only.
        </p>
        <ul className="divide-y divide-clinical-hairline text-sm">
          {bundle.entry?.map((e) => (
            <li key={e.fullUrl} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-3">
              <span className="w-44 shrink-0 font-mono font-semibold text-clinical-brandDark">
                {e.resource?.resourceType}
              </span>
              <span className="min-w-0 break-words text-clinical-inkSoft">{summary(e.resource)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowJson((v) => !v)} className="rounded-md border border-clinical-border bg-white px-3 py-1.5 text-sm font-medium text-clinical-ink">
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
          <button type="button" onClick={copy} className="rounded-md border border-clinical-border bg-white px-3 py-1.5 text-sm font-medium text-clinical-ink">
            {copied ? "Copied" : "Copy Bundle"}
          </button>
          <button type="button" onClick={download} className="rounded-md border border-clinical-border bg-white px-3 py-1.5 text-sm font-medium text-clinical-ink">
            Download .json
          </button>
        </div>
        {showJson && (
          <pre className="mt-3 max-h-[32rem] overflow-auto rounded-md bg-clinical-bg p-3 font-mono text-xs leading-relaxed text-clinical-ink">
            {json}
          </pre>
        )}
      </div>
    </details>
  );
}
