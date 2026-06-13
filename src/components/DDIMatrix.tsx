/**
 * DOAC × medication interaction matrix. Rows are the patient's active
 * medications; columns are the four DOACs. Each cell is color-coded by
 * severity; clicking a row expands the mechanism + recommendation detail.
 */
import { useState } from "react";
import type { DDICheckResult } from "../types/ddi";
import { DOAC_NAMES } from "../types/ddi";
import { Card, Pill } from "./primitives";
import {
  severityTone,
  SEVERITY_CELL,
  SEVERITY_LABEL,
  TONE_PILL,
  type Tone,
} from "../ui/format";

export function DDIMatrix({ results }: { results: DDICheckResult[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (results.length === 0) {
    return (
      <Card title="DOAC ↔ Therapy Interactions">
        <p className="text-sm text-clinical-muted">
          No active medications to screen.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="DOAC ↔ Therapy Interactions"
      right={
        <span className="text-xs text-clinical-muted">
          {results.length} medication{results.length === 1 ? "" : "s"} screened
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-clinical-panel py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide text-clinical-muted">
                Medication
              </th>
              {DOAC_NAMES.map((d) => (
                <th
                  key={d}
                  className="px-1.5 py-2 text-center text-xs font-medium capitalize text-clinical-muted"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <RowGroup
                key={`${r.rxnormCode}-${i}`}
                result={r}
                expanded={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Legend />
    </Card>
  );
}

function RowGroup({
  result,
  expanded,
  onToggle,
}: {
  result: DDICheckResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-clinical-border hover:bg-slate-50"
        onClick={onToggle}
      >
        <td className="sticky left-0 bg-inherit py-2 pr-3">
          <button className="flex items-center gap-1.5 text-left font-medium">
            <span
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
              aria-hidden
            >
              ▸
            </span>
            <span className="capitalize">{result.medication}</span>
          </button>
        </td>
        {DOAC_NAMES.map((d) => {
          const sev = result.perDoac[d].severity;
          return (
            <td key={d} className="px-1 py-1.5 text-center">
              <span
                className={`inline-block min-w-[3.25rem] rounded-md px-1.5 py-1 text-xs font-semibold ${TONE_PILL[severityTone(sev)]}`}
                title={SEVERITY_LABEL[sev]}
              >
                {SEVERITY_CELL[sev]}
              </span>
            </td>
          );
        })}
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={DOAC_NAMES.length + 1} className="px-3 py-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {DOAC_NAMES.map((d) => {
                const detail = result.perDoac[d];
                return (
                  <div
                    key={d}
                    className="rounded-lg border border-clinical-border bg-white p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold capitalize">{d}</span>
                      <Pill tone={severityTone(detail.severity)}>
                        {SEVERITY_LABEL[detail.severity]}
                      </Pill>
                    </div>
                    <p className="text-xs text-clinical-muted">
                      <span className="font-medium text-clinical-ink">
                        Mechanism:
                      </span>{" "}
                      {detail.mechanism}
                    </p>
                    <p className="mt-1 text-xs text-clinical-muted">
                      <span className="font-medium text-clinical-ink">
                        Action:
                      </span>{" "}
                      {detail.recommendation}
                    </p>
                    {detail.alternativeDoac && (
                      <p className="mt-1 text-xs">
                        <span className="font-medium">Prefer:</span>{" "}
                        <span className="capitalize">{detail.alternativeDoac}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Legend() {
  const items: { tone: Tone; label: string }[] = [
    { tone: "danger", label: "Major" },
    { tone: "warning", label: "Moderate / Additive bleeding" },
    { tone: "caution", label: "Minor" },
    { tone: "good", label: "None" },
    { tone: "neutral", label: "Unknown" },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-clinical-muted">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 rounded ${TONE_PILL[it.tone]}`}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
