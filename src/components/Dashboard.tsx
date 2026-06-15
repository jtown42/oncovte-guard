/** Full CDS dashboard for one patient: banner, recommendation, and detail cards. */
import { useMemo } from "react";
import type { PatientData } from "../types/patient";
import { generateRecommendation } from "../core/recommendation";
import { PatientBanner } from "./PatientBanner";
import { RecommendationPanel } from "./RecommendationPanel";
import { KhoranaScoreCard } from "./KhoranaScoreCard";
import { RenalPanel } from "./RenalPanel";
import { DDISummary } from "./DDIMatrix";
import { ContraindicationPanel } from "./ContraindicationPanel";
import { AlertList } from "./AlertList";

export function Dashboard({ patient }: { patient: PatientData }) {
  const rec = useMemo(() => generateRecommendation(patient), [patient]);

  return (
    <div className="space-y-4">
      <PatientBanner patient={patient} />

      {rec.alerts.length > 0 && <AlertList alerts={rec.alerts} />}

      {/* The verdict itself flashes on change (see RecommendationPanel/Flash). */}
      <RecommendationPanel rec={rec} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KhoranaScoreCard khorana={rec.khorana} />
        <RenalPanel renal={rec.renal} />
      </div>

      <DDISummary results={rec.ddiResults} />

      <ContraindicationPanel contraindications={rec.contraindications} />

      <details className="present-hide rounded-xl border border-clinical-border bg-slate-50 text-xs leading-relaxed text-clinical-muted">
        <summary className="cursor-pointer px-5 py-3 font-semibold uppercase tracking-wide">
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
