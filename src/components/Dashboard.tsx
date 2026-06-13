/** Full CDS dashboard for one patient: banner, recommendation, and detail cards. */
import { useMemo } from "react";
import type { PatientData } from "../types/patient";
import { generateRecommendation } from "../core/recommendation";
import { PatientBanner } from "./PatientBanner";
import { RecommendationPanel } from "./RecommendationPanel";
import { KhoranaScoreCard } from "./KhoranaScoreCard";
import { RenalPanel } from "./RenalPanel";
import { DDIMatrix } from "./DDIMatrix";
import { ContraindicationPanel } from "./ContraindicationPanel";
import { AlertList } from "./AlertList";

export function Dashboard({ patient }: { patient: PatientData }) {
  const rec = useMemo(() => generateRecommendation(patient), [patient]);

  return (
    <div className="space-y-4">
      <PatientBanner patient={patient} />

      {rec.alerts.length > 0 && <AlertList alerts={rec.alerts} />}

      <RecommendationPanel rec={rec} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KhoranaScoreCard khorana={rec.khorana} />
        <RenalPanel renal={rec.renal} />
      </div>

      <DDIMatrix results={rec.ddiResults} />

      <ContraindicationPanel contraindications={rec.contraindications} />

      <footer className="card-body rounded-xl border border-clinical-border bg-slate-50 text-xs leading-relaxed text-clinical-muted">
        <p className="mb-1 font-semibold uppercase tracking-wide">Disclaimers</p>
        <ul className="list-disc space-y-0.5 pl-4">
          {rec.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
