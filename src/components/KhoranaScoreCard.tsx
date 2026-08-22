/** Khorana VTE Risk Score card with per-criterion breakdown (max 6, ERRATA Issue 1). */
import type { KhoranaResult } from "../types/khorana";
import { MAX_KHORANA_SCORE } from "../types/khorana";
import { Card, Pill } from "./primitives";
import { Flash } from "./Flash";
import { riskTone, RISK_LABEL, humanize } from "../ui/format";

export function KhoranaScoreCard({ khorana }: { khorana: KhoranaResult }) {
  const { breakdown, exclusion } = khorana;

  if (exclusion.isExcluded) {
    return (
      <Card title="Khorana VTE Risk Score">
        <div className="rounded-md border-l-2 border-sev-info bg-sev-infoWash p-3 text-base text-sev-infoInk">
          <p>
            Not applicable. This cancer (
            <span className="font-medium">{humanize(exclusion.reason ?? "")}</span>
            ) is excluded from the Khorana model and follows its own VTE pathway
            (NCCN VTE-2).
          </p>
        </div>
      </Card>
    );
  }

  const rows: { label: string; value: string; score: number }[] = [
    {
      label: breakdown.cancerSite.value,
      value: "Cancer site",
      score: breakdown.cancerSite.score,
    },
    {
      label: "Platelets ≥ 350 ×10⁹/L",
      value: numUnit(breakdown.platelets.value, "×10⁹/L"),
      score: breakdown.platelets.score,
    },
    {
      label: breakdown.hemoglobin.esaFlag
        ? "Hemoglobin < 10 g/dL or on ESA"
        : "Hemoglobin < 10 g/dL",
      value: breakdown.hemoglobin.esaFlag
        ? `${numUnit(breakdown.hemoglobin.value, "g/dL")} · ESA`
        : numUnit(breakdown.hemoglobin.value, "g/dL"),
      score: breakdown.hemoglobin.score,
    },
    {
      label: "Leukocytes > 11 ×10⁹/L",
      value: numUnit(breakdown.wbc.value, "×10⁹/L"),
      score: breakdown.wbc.score,
    },
    {
      label: "BMI ≥ 35 kg/m²",
      value: numUnit(breakdown.bmi.value, "kg/m²"),
      score: breakdown.bmi.score,
    },
  ];

  return (
    <Card
      title="Khorana VTE Risk Score"
      right={
        <Pill tone={riskTone(khorana.riskCategory)} dot>
          {RISK_LABEL[khorana.riskCategory]} risk
        </Pill>
      }
    >
      <div className="flex items-end gap-2">
        <Flash watch={khorana.totalScore} tone={riskTone(khorana.riskCategory)}>
          <span className="metric-hero text-5xl font-medium tabular-nums leading-none">
            {khorana.totalScore}
          </span>
        </Flash>
        <span className="pb-1 text-sm text-clinical-muted">
          / {MAX_KHORANA_SCORE}
        </span>
        {/* Plain sentence rather than "≥ 2 → prophylaxis indicated". The arrow
            was standing in for "means", and the reader should not have to
            translate an inequality to learn the conclusion. */}
        <span className="ml-auto pb-1 text-base">
          {khorana.prophylaxisRecommended ? (
            <span className="font-semibold text-clinical-brandDark">
              Score of 2 or more: prophylaxis indicated
            </span>
          ) : (
            <span className="text-clinical-muted">
              Below the score of 2 needed for prophylaxis
            </span>
          )}
        </span>
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-clinical-hairline">
              <td className="py-1.5 pr-2">{r.label}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums text-clinical-muted">
                {r.value}
              </td>
              <td className="w-10 py-1.5 text-right font-semibold tabular-nums">
                +{r.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!khorana.isComplete && (
        <p className="mt-3 rounded-md bg-sev-cautionWash px-3 py-2 text-xs text-sev-cautionInk">
          Incomplete data — missing {khorana.missingFields.map(humanize).join(", ")}.
          Score may underestimate risk.
        </p>
      )}

      {/* WS-7: calibration-transparency caveat beneath the tier. */}
      {khorana.calibrationNote && (
        <p className="mt-3 text-xs leading-relaxed text-clinical-muted">
          {khorana.calibrationNote}
        </p>
      )}
    </Card>
  );
}

function numUnit(v: number | null, unit: string): string {
  return v == null ? "missing" : `${v} ${unit}`;
}
