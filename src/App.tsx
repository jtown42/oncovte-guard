/**
 * Application shell. Two launch modes share the exact same parsing + rendering
 * path (assemblePatientData → Dashboard):
 *
 *   1. SMART-on-FHIR — when the page is loaded as an OAuth2 redirect (a `code`
 *      param is present, or fhirclient has stored launch state), resolve the
 *      authorized client and fetch live data.
 *   2. Standalone demo — otherwise, present a picker over the five synthetic
 *      patients so the app is fully explorable without an EHR sandbox.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { PatientData } from "./types/patient";
import { Dashboard } from "./components/Dashboard";
import { ScenarioEditor } from "./components/ScenarioEditor";
import { assemblePatientData } from "./fhir/fhir-parser";
import {
  listSyntheticPatients,
  loadSyntheticPatient,
} from "./fhir/standalone-loader";
import {
  type Scenario,
  scenarioToPatient,
  patientToScenario,
} from "./standalone/scenario";
import { initSmartClient } from "./fhir/smart-launch";
import { fetchPatientData } from "./fhir/fhir-client";

type Mode = "smart" | "standalone";

function detectMode(): Mode {
  if (typeof window === "undefined") return "standalone";
  const params = new URLSearchParams(window.location.search);
  // A `code`/`state` param means we returned from the EHR's auth server;
  // SMART_KEY in sessionStorage means fhirclient has an in-flight launch.
  if (params.has("code") || params.has("state")) return "smart";
  if (sessionStorage.getItem("SMART_KEY")) return "smart";
  return "standalone";
}

export function App() {
  const mode = useMemo(detectMode, []);
  return (
    <div className="min-h-screen">
      <TopBar mode={mode} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {mode === "smart" ? <SmartView /> : <StandaloneView />}
      </main>
    </div>
  );
}

function TopBar({ mode }: { mode: Mode }) {
  return (
    <div className="border-b border-clinical-border bg-clinical-panel">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clinical-brand text-sm font-bold text-white">
          VG
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-clinical-ink">OncoVTE Guard</p>
          <p className="text-xs text-clinical-muted">
            Cancer-associated VTE prophylaxis · DOAC interaction CDS
          </p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-clinical-muted">
          {mode === "smart" ? "SMART-on-FHIR" : "Standalone demo"}
        </span>
      </div>
    </div>
  );
}

/* ---------- SMART mode ---------- */

function SmartView() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; patient: PatientData }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = await initSmartClient();
        const raw = await fetchPatientData(client);
        const patient = assemblePatientData(raw, new Date());
        if (!cancelled) setState({ kind: "ready", patient });
      } catch (e) {
        if (!cancelled)
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : String(e),
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") return <Centered>Loading patient data…</Centered>;
  if (state.kind === "error")
    return (
      <Centered>
        <p className="font-semibold text-rose-700">Could not load EHR data</p>
        <p className="mt-1 text-sm text-clinical-muted">{state.message}</p>
      </Centered>
    );
  return <Dashboard patient={state.patient} />;
}

/* ---------- Standalone demo mode ---------- */

/** Load preset `index` and seed an editable scenario from it. */
function presetScenario(index: number): Scenario {
  return patientToScenario(
    assemblePatientData(loadSyntheticPatient(index), new Date()),
  );
}

function StandaloneView() {
  const roster = useMemo(() => listSyntheticPatients(), []);
  const [scenario, setScenario] = useState<Scenario>(() => presetScenario(0));
  // The currently-loaded preset, or null once the user diverges ("custom").
  const [activePreset, setActivePreset] = useState<number | null>(0);

  const patient = useMemo(() => scenarioToPatient(scenario), [scenario]);

  const loadPreset = (index: number) => {
    setScenario(presetScenario(index));
    setActivePreset(index);
  };
  const change = (patch: Partial<Scenario>) => {
    setScenario((s) => ({ ...s, ...patch }));
    setActivePreset(null);
  };

  return (
    <div className="space-y-4">
      <ScenarioEditor
        scenario={scenario}
        presets={roster.map((p) => ({ index: p.index, name: p.name }))}
        activePreset={activePreset}
        onLoadPreset={loadPreset}
        onChange={change}
      />
      <p className="px-1 text-xs text-clinical-muted">
        Synthetic data — no PHI. Every edit re-runs the real clinical engine.
        For demonstration and evaluation only.
      </p>
      <Dashboard patient={patient} />
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">{children}</div>
  );
}
