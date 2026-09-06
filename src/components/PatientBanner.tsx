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
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
        <h1 className="patient-name truncate text-xl font-semibold tracking-tight text-clinical-ink">
          {patient.name}
        </h1>
        <span className="text-sm text-clinical-muted">
          {patient.age} · {patient.gender === "female" ? "F" : "M"}
        </span>
        <span className="hidden h-4 w-px self-center bg-clinical-border sm:block" aria-hidden />
        <span className="min-w-0 text-sm">
          {dx ? (
            <>
              <span className="font-medium text-clinical-ink">{dx.display}</span>{" "}
              <span className="font-mono text-xs text-clinical-muted">{dx.code}</span>
            </>
          ) : (
            <span className="text-clinical-muted">No active cancer diagnosis on file</span>
          )}
        </span>

        <dl className="present-hide ml-auto flex shrink-0 items-baseline gap-x-5">
          <Stat label="BMI" value={fmt(patient.bmi, "")} />
          <Stat label="Weight" value={fmt(patient.weightKg, "kg")} />
        </dl>
      </div>

      {(flags.length > 0 || patient.race || patient.ethnicity) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-clinical-hairline bg-clinical-bg px-5 py-2">
          {flags.map((f) => (
            <Pill key={f.label} tone="info" dot>
              {f.label}
            </Pill>
          ))}
          {(patient.race || patient.ethnicity) && (
            <span className="ml-auto text-xs text-clinical-faint">
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
    <div className="flex items-baseline gap-1.5">
      <dt className="text-xs text-clinical-muted">{label}</dt>
      <dd className="font-mono text-sm font-medium tabular-nums text-clinical-ink">
        {value}
      </dd>
    </div>
  );
}

function fmt(n: number | null, unit: string): string {
  if (n == null) return "—";
  return unit ? `${n} ${unit}` : String(n);
}
