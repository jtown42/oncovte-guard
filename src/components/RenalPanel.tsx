/** Renal function panel: Cockcroft-Gault CrCl + per-anticoagulant guidance. */
import type { RenalResult } from "../types/renal";
import { Card, Pill } from "./primitives";
import { Flash } from "./Flash";
import {
  crclTone,
  CRCL_LABEL,
  renalStatusTone,
  RENAL_STATUS_LABEL,
  humanize,
} from "../ui/format";

export function RenalPanel({ renal }: { renal: RenalResult | null }) {
  if (!renal) {
    return (
      <Card title="Renal Function">
        <p className="rounded-md bg-sev-cautionWash px-3 py-2 text-sm text-sev-cautionInk">
          CrCl could not be calculated — weight and/or serum creatinine are
          missing. Obtain both before dosing any anticoagulant.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Renal Function"
      right={
        <Pill tone={crclTone(renal.crclCategory)} dot>
          {CRCL_LABEL[renal.crclCategory]}
        </Pill>
      }
    >
      <div className="flex items-end gap-2">
        <Flash watch={renal.crclMlMin} tone={crclTone(renal.crclCategory)}>
          <span className="metric-hero text-5xl font-medium tabular-nums leading-none">
            {renal.crclMlMin}
          </span>
        </Flash>
        <span className="pb-0.5 text-sm text-clinical-muted">
          mL/min · Cockcroft-Gault
        </span>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-sm text-clinical-muted">
            <th className="pb-1 font-medium">Anticoagulant</th>
            <th className="pb-1 font-medium">Status</th>
            <th className="pb-1 font-medium">Dose</th>
          </tr>
        </thead>
        <tbody>
          {renal.doacRecommendations.map((rec) => (
            <tr key={rec.doac} className="border-t border-clinical-hairline align-top">
              <td className="py-1.5 pr-2 font-medium capitalize">{rec.doac}</td>
              <td className="py-1.5 pr-2">
                <Pill tone={renalStatusTone(rec.recommendation)}>
                  {RENAL_STATUS_LABEL[rec.recommendation]}
                </Pill>
              </td>
              <td className="py-1.5 text-clinical-muted">{rec.dose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {renal.warnings.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {renal.warnings.map((w) => (
            <Pill key={w} tone="warning">
              {humanize(w)}
            </Pill>
          ))}
        </ul>
      )}
    </Card>
  );
}
