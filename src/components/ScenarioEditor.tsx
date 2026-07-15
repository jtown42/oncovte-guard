/**
 * Interactive "what-if" control rail for the standalone demo. Every control
 * mutates the Scenario; the parent rebuilds PatientData and the dashboard
 * recomputes the real recommendation live. This is the visible proof that there
 * is a reasoning engine underneath, not a set of fixed pages.
 *
 * Laid out as a single vertical column so it lives in a sticky left rail beside
 * the dashboard: the verdict on the right never scrolls out of view while a
 * slider is dragged. The high-stakes drivers (platelets, creatinine, meds) lead;
 * stable demographics are tucked into a collapsible section to cut stage noise.
 */
import {
  type Scenario,
  CANCER_OPTIONS,
  medGroups,
  medLabel,
} from "../standalone/scenario";

interface PresetSummary {
  index: number;
  name: string;
}

interface ScenarioEditorProps {
  scenario: Scenario;
  presets: PresetSummary[];
  activePreset: number | null;
  onLoadPreset: (index: number) => void;
  onChange: (patch: Partial<Scenario>) => void;
}

export function ScenarioEditor({
  scenario: s,
  presets,
  activePreset,
  onLoadPreset,
  onChange,
}: ScenarioEditorProps) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-clinical-border px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-clinical-ink">
          Live patient editor
        </h2>
      </div>

      {/* Preset chips — primary navigation between the demo scenarios. */}
      <div className="border-b border-clinical-border bg-slate-50/60 px-4 py-3">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-clinical-muted">
          Scenario
        </span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.index}
              onClick={() => onLoadPreset(p.index)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activePreset === p.index
                  ? "bg-clinical-brand text-white shadow-sm"
                  : "border border-clinical-border bg-white text-clinical-ink hover:border-clinical-brand hover:text-clinical-brand"
              }`}
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
          {activePreset === null && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <Field label="Cancer diagnosis (ICD-10)">
          <select
            value={s.conditionCode}
            onChange={(e) => onChange({ conditionCode: e.target.value })}
            className="w-full rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm font-medium text-clinical-ink focus:border-clinical-brand focus:outline-none focus:ring-1 focus:ring-clinical-brand"
          >
            {CANCER_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {/* High-stakes labs — the knobs that move the verdict on stage. */}
        <div>
          <SectionLabel>Labs &amp; vitals</SectionLabel>
          <div className="space-y-4">
            <LabSlider
              label="Platelets"
              value={s.platelets}
              min={20}
              max={700}
              step={1}
              unit="10³/µL"
              fallback={250}
              onChange={(v) => onChange({ platelets: v })}
            />
            <LabSlider
              label="Hemoglobin"
              value={s.hemoglobin}
              min={5}
              max={18}
              step={0.1}
              unit="g/dL"
              fallback={12}
              onChange={(v) => onChange({ hemoglobin: v })}
            />
            <LabSlider
              label="WBC"
              value={s.wbc}
              min={1}
              max={40}
              step={0.1}
              unit="10³/µL"
              fallback={7}
              onChange={(v) => onChange({ wbc: v })}
            />
            <LabSlider
              label="Serum creatinine"
              value={s.serumCreatinine}
              min={0.3}
              max={8}
              step={0.1}
              unit="mg/dL"
              fallback={1}
              onChange={(v) => onChange({ serumCreatinine: v })}
            />
          </div>
        </div>

        <Field label="Active medications (drives DDI matrix & flags)">
          <MedPicker
            medCodes={s.medCodes}
            onChange={(medCodes) => onChange({ medCodes })}
          />
        </Field>

        {/* Clinician-assessed safety flag — a universal absolute contraindication.
            Toggling this on flips any otherwise-recommended patient to
            'contraindicated', demonstrating the safety gate live. */}
        <Field label="Clinical safety flag">
          <Toggle
            on={s.hasActiveMajorBleeding}
            onClick={() =>
              onChange({ hasActiveMajorBleeding: !s.hasActiveMajorBleeding })
            }
            label={
              s.hasActiveMajorBleeding
                ? "Active major bleeding — anticoagulation contraindicated"
                : "Active major bleeding (clinician-assessed)"
            }
          />
        </Field>

        {/* Stable / lower-stakes inputs — out of prime visual space. */}
        <details className="rounded-lg border border-clinical-border bg-slate-50/50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-clinical-muted">
            Demographics &amp; body metrics
          </summary>
          <div className="space-y-4 px-3 pb-4 pt-1">
            <Field label="Sex">
              <div className="flex rounded-lg border border-clinical-border p-0.5">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => onChange({ gender: g })}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition ${
                      s.gender === g
                        ? "bg-clinical-brand text-white"
                        : "text-clinical-muted hover:text-clinical-ink"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
            <NumberSlider
              label="Age"
              value={s.age}
              min={18}
              max={95}
              step={1}
              unit="yr"
              onChange={(v) => onChange({ age: v })}
            />
            <NumberSlider
              label="BMI"
              value={s.bmi}
              min={15}
              max={55}
              step={0.1}
              unit="kg/m²"
              onChange={(v) => onChange({ bmi: v })}
            />
            <NumberSlider
              label="Weight"
              value={s.weightKg}
              min={35}
              max={160}
              step={1}
              unit="kg"
              onChange={(v) => onChange({ weightKg: v })}
            />
            <Field label="On erythropoiesis-stimulating agent (ESA)">
              <Toggle
                on={s.onESA}
                onClick={() => onChange({ onESA: !s.onESA })}
                label={s.onESA ? "Yes — scores Khorana Hgb criterion" : "No"}
              />
            </Field>
          </div>
        </details>
      </div>
    </section>
  );
}

/* ---------- controls ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-clinical-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-clinical-ink">
      {children}
    </p>
  );
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-clinical-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-clinical-ink">
          {round(value, step)}{" "}
          <span className="text-xs font-normal text-clinical-muted">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-clinical w-full"
      />
    </div>
  );
}

function LabSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  fallback,
  onChange,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  unit: string;
  fallback: number;
  onChange: (v: number | null) => void;
}) {
  const present = value != null;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-clinical-muted">{label}</span>
        <span className="flex items-baseline gap-2">
          {present ? (
            <span className="text-sm font-semibold tabular-nums text-clinical-ink">
              {round(value as number, step)}{" "}
              <span className="text-xs font-normal text-clinical-muted">
                {unit}
              </span>
            </span>
          ) : (
            <span className="text-xs italic text-clinical-muted">
              not measured
            </span>
          )}
          <button
            onClick={() => onChange(present ? null : fallback)}
            className="text-xs font-medium text-clinical-brand hover:underline"
            title={present ? "Mark as not measured" : "Add a value"}
          >
            {present ? "clear" : "set"}
          </button>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={present ? (value as number) : fallback}
        disabled={!present}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-clinical w-full disabled:opacity-40"
      />
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5"
      role="switch"
      aria-checked={on}
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          on ? "bg-clinical-brand" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            on ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
      <span className="text-sm text-clinical-ink">{label}</span>
    </button>
  );
}

function MedPicker({
  medCodes,
  onChange,
}: {
  medCodes: string[];
  onChange: (codes: string[]) => void;
}) {
  const selected = new Set(medCodes);
  const groups = medGroups();

  const add = (code: string) => {
    if (code && !selected.has(code)) onChange([...medCodes, code]);
  };
  const remove = (code: string) =>
    onChange(medCodes.filter((c) => c !== code));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {medCodes.length === 0 && (
          <span className="text-sm italic text-clinical-muted">
            No active medications
          </span>
        )}
        {medCodes.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-full border border-clinical-border bg-white py-0.5 pl-2.5 pr-1 text-xs font-medium text-clinical-ink"
          >
            {medLabel(code)}
            <button
              onClick={() => remove(code)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-clinical-muted hover:bg-rose-100 hover:text-rose-700"
              aria-label={`Remove ${medLabel(code)}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.currentTarget.selectedIndex = 0;
        }}
        className="w-full rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm text-clinical-muted focus:border-clinical-brand focus:outline-none focus:ring-1 focus:ring-clinical-brand"
      >
        <option value="">+ Add a medication…</option>
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.options
              .filter((o) => !selected.has(o.code))
              .map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function round(v: number, step: number): string {
  const decimals = step < 1 ? 1 : 0;
  return v.toFixed(decimals);
}
