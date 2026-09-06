/** Full CDS dashboard for one patient: banner, recommendation, and detail cards. */
import { useMemo } from "react";
import type { PatientData } from "../types/patient";
import { generateRecommendation } from "../core/recommendation";
import { PatientBanner } from "./PatientBanner";
import { RecommendationPanel } from "./RecommendationPanel";
import { KhoranaScoreCard } from "./KhoranaScoreCard";
import { BleedingRiskPanel } from "./BleedingRiskPanel";
import { RenalPanel } from "./RenalPanel";
import { DDISummary } from "./DDIMatrix";
import { ContraindicationPanel } from "./ContraindicationPanel";
import { AlertList } from "./AlertList";

export function Dashboard({ patient }: { patient: PatientData }) {
  const rec = useMemo(() => generateRecommendation(patient), [patient]);

  return (
    <div className="space-y-3">
      <PatientBanner patient={patient} />

      {/* The verdict leads. The terminal decision already encodes the critical
          state (a universal contraindication turns the hero red), and the pathway
          strip narrates the safety/DDI story — so alerts follow the decision as
          considerations rather than competing with it for the first read. */}
      <RecommendationPanel rec={rec} />

      {rec.alerts.length > 0 && <AlertList alerts={rec.alerts} />}

      {/* Everything below is the auditable evidence behind the decision above —
          subordinated by a quiet divider so the verdict clearly leads. */}
      <div className="flex items-center gap-3 pt-1">
        <span className="eyebrow">Supporting detail</span>
        <span className="h-px flex-1 bg-clinical-hairline" />
      </div>

      {/* Thrombotic risk (Khorana) beside bleeding risk — the two sides of the
          prophylaxis decision, shown together so the asymmetry is visible.
          items-start: the cards have genuinely different natural heights; let
          each size to its content rather than stretching the shorter one. */}
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <KhoranaScoreCard khorana={rec.khorana} />
        <BleedingRiskPanel profile={rec.bleedingRisk} />
      </div>

      <RenalPanel renal={rec.renal} />

      <DDISummary results={rec.ddiResults} />

      <ContraindicationPanel contraindications={rec.contraindications} />

      <details className="present-hide rounded-card border border-clinical-hairline bg-clinical-bg text-xs leading-relaxed text-clinical-muted">
        <summary className="cursor-pointer px-4 py-3 text-base font-semibold">
          Disclaimers
        </summary>
        <ul className="list-disc space-y-0.5 px-5 pb-4 pl-9">
          {rec.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
