/** Patient demographics + key clinical flags banner (top of dashboard). */
import type { PatientData } from "../types/patient";
import { Pill } from "./primitives";

function flagPills(p: PatientData) {
  const flags: { label: string }[] = [];
  if (p.onESA) flags.push({ label: "On ESA" });
  if (p.onAntiplatelet) flags.push({ label: "On antiplatelet" });
  if (p.onIMiD) flags.push({ label: "On IMiD" });
  if (p.hasNephrotoxicChemo) flags.push({ label: "Nephrotoxic chemo" });
  return flags;
}

export function PatientBanner({ patient }: { patient: PatientData }) {
  const dx = patient.activeCancerConditions[0];
  const flags = flagPills(patient);

  return (
    <header className="card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="patient-name truncate text-xl font-bold text-clinical-ink">
              {patient.name}
            </h1>
            <span className="text-sm text-clinical-muted">
              {patient.age} y · {patient.gender === "female" ? "Female" : "Male"}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-clinical-muted">
            {dx ? (
              <>
                <span className="font-medium text-clinical-ink">
                  {dx.display}
                </span>{" "}
                <span className="font-mono text-xs">({dx.code})</span>
              </>
            ) : (
              "No active cancer diagnosis on file"
            )}
          </p>
        </div>

        <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-1 text-sm">
          <Stat label="Weight" value={fmt(patient.weightKg, "kg")} />
          <Stat label="Height" value={fmt(patient.heightCm, "cm")} />
          <Stat label="BMI" value={fmt(patient.bmi, "kg/m²")} />
        </dl>
      </div>

      {(flags.length > 0 || patient.race || patient.ethnicity) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-clinical-border bg-slate-50/60 px-5 py-2.5">
          {flags.map((f) => (
            <Pill key={f.label} tone="info" dot>
              {f.label}
            </Pill>
          ))}
          {(patient.race || patient.ethnicity) && (
            <span className="ml-auto text-xs text-clinical-muted">
              {[patient.race, patient.ethnicity].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      )}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-clinical-muted">
        {label}
      </dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function fmt(n: number | null, unit: string): string {
  return n == null ? "—" : `${n} ${unit}`;
}
