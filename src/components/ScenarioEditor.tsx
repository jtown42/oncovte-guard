/**
 * Interactive "what-if" editor for the standalone demo. Every control mutates
 * the Scenario; the parent rebuilds PatientData and the dashboard recomputes
 * the real recommendation live. This is the visible proof that there is a
 * reasoning engine underneath, not a set of fixed pages.
 */
import { useState } from "react";
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
  const [open, setOpen] = useState(true);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-clinical-border px-5 py-3">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-clinical-ink">
            Live patient editor
          </h2>
        </span>
        <span className="hidden text-xs text-clinical-muted sm:inline">
          Edit any input — the recommendation below recomputes instantly.
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-clinical-brand hover:bg-slate-100"
        >
          {open ? "Hide controls ▴" : "Show controls ▾"}
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-clinical-border bg-slate-50/60 px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-clinical-muted">
          Start from
        </span>
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
            {p.name}
          </button>
        ))}
        {activePreset === null && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Custom scenario
          </span>
        )}
      </div>

      {open && (
        <div className="space-y-5 px-5 py-4">
          {/* Diagnosis + demographics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>

          {/* Khorana + renal drivers */}
          <div>
            <SectionLabel>
              Labs &amp; vitals{" "}
              <span className="font-normal normal-case text-clinical-muted">
                — drive Khorana score &amp; renal dosing
              </span>
            </SectionLabel>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Flags + medications */}
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <Field label="On erythropoiesis-stimulating agent (ESA)">
              <Toggle
                on={s.onESA}
                onClick={() => onChange({ onESA: !s.onESA })}
                label={s.onESA ? "Yes — scores Khorana Hgb criterion" : "No"}
              />
            </Field>

            <Field label="Active medications (drives DDI matrix & flags)">
              <MedPicker
                medCodes={s.medCodes}
                onChange={(medCodes) => onChange({ medCodes })}
              />
            </Field>
          </div>
        </div>
      )}
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
