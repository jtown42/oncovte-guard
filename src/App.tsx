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
import { assemblePatientData } from "./fhir/fhir-parser";
import {
  listSyntheticPatients,
  loadSyntheticPatient,
} from "./fhir/standalone-loader";
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

function StandaloneView() {
  const roster = useMemo(() => listSyntheticPatients(), []);
  const [index, setIndex] = useState(0);
  const patient = useMemo(
    () => assemblePatientData(loadSyntheticPatient(index), new Date()),
    [index],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Synthetic patients</h2>
          </div>
          <nav className="p-2">
            {roster.map((p) => (
              <button
                key={p.index}
                onClick={() => setIndex(p.index)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  p.index === index
                    ? "bg-clinical-brand text-white"
                    : "hover:bg-slate-100 text-clinical-ink"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span
                  className={`block text-xs ${
                    p.index === index ? "text-white/80" : "text-clinical-muted"
                  }`}
                >
                  Case {p.index + 1}
                </span>
              </button>
            ))}
          </nav>
        </div>
        <p className="mt-2 px-1 text-xs text-clinical-muted">
          Synthetic data — no PHI. For demonstration and evaluation only.
        </p>
      </aside>

      <div className="min-w-0">
        <Dashboard patient={patient} />
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">{children}</div>
  );
}
